#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_updater::UpdaterExt;

/// 更新信息，复用现有 Electron 侧的字段语义
#[derive(Serialize, Clone)]
struct UpdateInfo {
  version: String,
  date: Option<String>,
  body: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(tag = "event", content = "data")]
enum UpdateProgressEvent {
  Started { content_length: Option<u64> },
  Progress {
    downloaded: u64,
    content_length: Option<u64>,
  },
  Finished {},
}

/// 打开外部链接
#[tauri::command]
async fn open_external(app_handle: AppHandle, url: String) -> Result<(), String> {
  let parsed = url::Url::parse(&url).map_err(|e| format!("Invalid URL: {e}"))?;

  app_handle
    .plugins()
    .shell()
    .open(parsed, None)
    .map_err(|e| format!("Failed to open external url: {e}"))?;

  Ok(())
}

/// 重新启动应用（尽量模拟 Electron 的 relaunch 语义）
#[tauri::command]
fn relaunch(app_handle: AppHandle) -> Result<(), String> {
  app_handle.restart();
  Ok(())
}

/// 窗口控制相关命令
#[tauri::command]
fn window_minimize(window: WebviewWindow) -> Result<(), String> {
  window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn window_maximize_toggle(window: WebviewWindow) -> Result<(), String> {
  if window.is_maximized().unwrap_or(false) {
    window.unmaximize().map_err(|e| e.to_string())
  } else {
    window.maximize().map_err(|e| e.to_string())
  }
}

#[tauri::command]
fn window_close(window: WebviewWindow) -> Result<(), String> {
  window.close().map_err(|e| e.to_string())
}

#[tauri::command]
fn window_is_maximized(window: WebviewWindow) -> Result<bool, String> {
  Ok(window.is_maximized().unwrap_or(false))
}

/// 检查是否有可用更新
#[tauri::command]
async fn updater_check(app_handle: AppHandle) -> Result<Option<UpdateInfo>, String> {
  let updater = app_handle.updater_builder().map_err(|e| e.to_string())?;
  let update = updater.check().await.map_err(|e| e.to_string())?;

  if let Some(info) = update {
    let meta = info.manifest;
    Ok(Some(UpdateInfo {
      version: meta.version,
      date: meta.date,
      body: meta.body,
    }))
  } else {
    Ok(None)
  }
}

/// 下载并安装更新，同时通过事件推送进度
#[tauri::command]
async fn updater_download_and_install(app_handle: AppHandle) -> Result<(), String> {
  let updater = app_handle.updater_builder().map_err(|e| e.to_string())?;
  let mut session = updater.download().await.map_err(|e| e.to_string())?;

  let content_length = session.content_length();

  app_handle
    .emit(
      "updater:progress",
      UpdateProgressEvent::Started { content_length },
    )
    .map_err(|e| e.to_string())?;

  while let Some(chunk) = session.chunk().await.map_err(|e| e.to_string())? {
    app_handle
      .emit(
        "updater:progress",
        UpdateProgressEvent::Progress {
          downloaded: chunk.bytes_downloaded(),
          content_length,
        },
      )
      .map_err(|e| e.to_string())?;
  }

  session.install().await.map_err(|e| e.to_string())?;

  app_handle
    .emit("updater:progress", UpdateProgressEvent::Finished {})
    .map_err(|e| e.to_string())?;

  Ok(())
}

/// 执行更新安装（通常在下载完成后调用）
#[tauri::command]
async fn updater_install(app_handle: AppHandle) -> Result<(), String> {
  let updater = app_handle.updater_builder().map_err(|e| e.to_string())?;
  let mut session = updater.download().await.map_err(|e| e.to_string())?;
  session.install().await.map_err(|e| e.to_string())?;
  Ok(())
}

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      open_external,
      relaunch,
      window_minimize,
      window_maximize_toggle,
      window_close,
      window_is_maximized,
      updater_check,
      updater_download_and_install,
      updater_install
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

