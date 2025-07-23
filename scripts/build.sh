#!/bin/bash

# Kit 项目构建脚本
# 提供多种构建选项和优化配置

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 显示帮助信息
show_help() {
    echo "Kit 构建脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help              显示此帮助信息"
    echo "  -d, --dev               开发构建"
    echo "  -p, --production        生产构建（默认）"
    echo "  -a, --analyze           构建并分析产物"
    echo "  -f, --fast              快速构建（用于测试）"
    echo "  -c, --clean             构建前清理"
    echo "  -t, --tauri             构建 Tauri 应用"
    echo "  -r, --release [type]    发布版本 (patch|minor|major)"
    echo "  --debug                 启用调试模式"
    echo "  --profile [name]        使用指定的 Cargo 配置文件"
    echo ""
    echo "示例:"
    echo "  $0 --production         # 生产构建"
    echo "  $0 --analyze            # 构建并分析"
    echo "  $0 --tauri --fast       # 快速 Tauri 构建"
    echo "  $0 --release minor      # 发布次要版本"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    if [[ "$BUILD_TAURI" == "true" ]] && ! command -v cargo &> /dev/null; then
        log_error "Rust/Cargo 未安装"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 清理构建产物
clean_build() {
    log_info "清理构建产物..."
    
    rm -rf dist
    rm -rf src-tauri/target/release
    rm -rf node_modules/.vite
    
    if [[ "$CLEAN_ALL" == "true" ]]; then
        rm -rf node_modules
        log_info "重新安装依赖..."
        npm install
    fi
    
    log_success "清理完成"
}

# 安装依赖
install_dependencies() {
    if [[ ! -d "node_modules" ]]; then
        log_info "安装前端依赖..."
        npm ci --prefer-offline --no-audit
        log_success "前端依赖安装完成"
    fi
}

# 前端构建
build_frontend() {
    log_info "构建前端应用..."
    
    if [[ "$BUILD_MODE" == "development" ]]; then
        npm run build
    elif [[ "$BUILD_MODE" == "production" ]]; then
        NODE_ENV=production npm run build
    elif [[ "$BUILD_MODE" == "fast" ]]; then
        npm run build
    fi
    
    log_success "前端构建完成"
}

# Tauri 构建
build_tauri() {
    log_info "构建 Tauri 应用..."
    
    cd src-tauri
    
    if [[ "$BUILD_MODE" == "development" ]]; then
        cargo build
    elif [[ "$BUILD_MODE" == "fast" ]]; then
        cargo build --profile fast-release
    elif [[ "$DEBUG_MODE" == "true" ]]; then
        cargo build --profile release-with-debug
    elif [[ -n "$CARGO_PROFILE" ]]; then
        cargo build --profile "$CARGO_PROFILE"
    else
        cargo build --release
    fi
    
    cd ..
    log_success "Tauri 构建完成"
}

# 分析构建产物
analyze_build() {
    log_info "分析构建产物..."
    
    if [[ -f "scripts/build-optimizer.mjs" ]]; then
        node scripts/build-optimizer.mjs
        log_success "构建分析完成"
    else
        log_warning "构建分析器未找到"
    fi
}

# 发布版本
release_version() {
    local release_type="$1"
    
    if [[ -z "$release_type" ]]; then
        release_type="patch"
    fi
    
    log_info "发布 $release_type 版本..."
    
    # 确保工作目录干净
    if [[ -n "$(git status --porcelain)" ]]; then
        log_error "工作目录不干净，请先提交或暂存更改"
        exit 1
    fi
    
    # 更新版本号
    npm version "$release_type" --no-git-tag-version
    
    # 提交更改
    local new_version=$(node -p "require('./package.json').version")
    git add package.json src-tauri/Cargo.toml
    git commit -m "chore: bump version to v$new_version"
    
    # 创建标签
    git tag "v$new_version"
    
    log_success "版本 v$new_version 已创建"
    log_info "运行 'git push --tags' 来推送标签并触发构建"
}

# 显示构建信息
show_build_info() {
    log_info "构建配置:"
    echo "  模式: $BUILD_MODE"
    echo "  Tauri: $BUILD_TAURI"
    echo "  分析: $ANALYZE"
    echo "  清理: $CLEAN"
    echo "  调试: $DEBUG_MODE"
    if [[ -n "$CARGO_PROFILE" ]]; then
        echo "  Cargo 配置: $CARGO_PROFILE"
    fi
    echo ""
}

# 主函数
main() {
    local start_time=$(date +%s)
    
    log_info "🚀 开始构建 Kit 应用"
    show_build_info
    
    # 检查依赖
    check_dependencies
    
    # 清理（如果需要）
    if [[ "$CLEAN" == "true" ]]; then
        clean_build
    fi
    
    # 安装依赖
    install_dependencies
    
    # 构建前端
    build_frontend
    
    # 构建 Tauri（如果需要）
    if [[ "$BUILD_TAURI" == "true" ]]; then
        build_tauri
    fi
    
    # 分析构建产物（如果需要）
    if [[ "$ANALYZE" == "true" ]]; then
        analyze_build
    fi
    
    # 发布版本（如果需要）
    if [[ -n "$RELEASE_TYPE" ]]; then
        release_version "$RELEASE_TYPE"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "🎉 构建完成！耗时: ${duration}s"
}

# 默认配置
BUILD_MODE="production"
BUILD_TAURI="false"
ANALYZE="false"
CLEAN="false"
DEBUG_MODE="false"
CLEAN_ALL="false"
RELEASE_TYPE=""
CARGO_PROFILE=""

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--dev)
            BUILD_MODE="development"
            shift
            ;;
        -p|--production)
            BUILD_MODE="production"
            shift
            ;;
        -a|--analyze)
            ANALYZE="true"
            shift
            ;;
        -f|--fast)
            BUILD_MODE="fast"
            shift
            ;;
        -c|--clean)
            CLEAN="true"
            shift
            ;;
        --clean-all)
            CLEAN="true"
            CLEAN_ALL="true"
            shift
            ;;
        -t|--tauri)
            BUILD_TAURI="true"
            shift
            ;;
        -r|--release)
            if [[ -n "$2" && "$2" != -* ]]; then
                RELEASE_TYPE="$2"
                shift 2
            else
                RELEASE_TYPE="patch"
                shift
            fi
            ;;
        --debug)
            DEBUG_MODE="true"
            shift
            ;;
        --profile)
            if [[ -n "$2" && "$2" != -* ]]; then
                CARGO_PROFILE="$2"
                shift 2
            else
                log_error "--profile 需要指定配置文件名"
                exit 1
            fi
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 运行主函数
main