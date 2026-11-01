import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { gitCategories, searchGitCommands, type GitCommandCategory } from "./logic"

export default function GitHelper() {
  const query = signal("")
  const category = signal<GitCommandCategory | "all">("all")
  const results = () => searchGitCommands(query(), category())

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("Git 命令助手", "Git command helper")}
          description={L("搜索常用命令并复制到终端；本工具不会执行命令。", "Search common commands and copy them to your terminal. Commands are never executed here.")}
        />
        <TextInput
          value={query()}
          onChange={(value) => query.set(value)}
          testID="git-helper-query"
          placeholder={L("搜索命令、说明或 Git 操作…", "Search commands, descriptions or Git actions…")}
        />
        <View class="flex-row flex-wrap gap-2">
          <Button tone={category() === "all" ? "primary" : "secondary"} onPress={() => category.set("all")} testID="git-category-all">
            {L("全部", "All")}
          </Button>
          {gitCategories.map((item) => (
            <Button tone={category() === item.id ? "primary" : "secondary"} onPress={() => category.set(item.id)} testID={`git-category-${item.id}`}>
              {L(item.name.zh, item.name.en)}
            </Button>
          ))}
        </View>
      </Card>

      <Card testID="git-helper-results">
        <CardHeader
          title={L("命令参考", "Command reference")}
          description={`${results().length} ${L("条命令", "commands")}`}
        />
        <View class="gap-2">
          {results().map((command) => (
            <View class="gap-2 rounded-md bg-muted/30 p-3">
              <View class="flex-row flex-wrap items-center justify-between gap-2">
                <View class="min-w-0 flex-1 gap-0.5">
                  <Text class="text-sm font-medium text-foreground">{L(command.name.zh, command.name.en)}</Text>
                  <Text class="text-xs text-muted-foreground">{L(command.description.zh, command.description.en)}</Text>
                </View>
                <CopyButton value={command.command} label={L("复制", "Copy")} testID={`git-copy-${command.id}`} />
              </View>
              <Text class="font-mono text-xs text-primary">{command.command}</Text>
            </View>
          ))}
          {!results().length ? (
            <Text class="py-4 text-center text-sm text-muted-foreground">
              {L("没有找到匹配的命令。", "No matching commands.")}
            </Text>
          ) : null}
        </View>
      </Card>
    </View>
  )
}
