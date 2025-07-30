import { createFileRoute } from '@tanstack/react-router'
import { AdSenseAd } from '@/components/adsense-ad'

export const Route = createFileRoute('/test-ad')({
  component: TestAdPage,
})

function TestAdPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">AdSense 测试页面</h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">广告位 1</h2>
          <AdSenseAd adClient="ca-pub-3854566314387093" adSlot="9901453595" />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">广告位 2</h2>
          <AdSenseAd adClient="ca-pub-3854566314387093" adSlot="9901453595" />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">广告位 3</h2>
          <AdSenseAd adClient="ca-pub-3854566314387093" adSlot="9901453595" />
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">调试信息：</h3>
        <ul className="text-sm space-y-1">
          <li>• AdSense 脚本已加载</li>
          <li>• ads.txt 文件可访问</li>
          <li>• 广告单元 ID: 9901453595</li>
          <li>• 发布商 ID: ca-pub-3854566314387093</li>
        </ul>
      </div>
    </div>
  )
}
