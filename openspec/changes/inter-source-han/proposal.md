# 中英文字体分配

用户要求中文使用思源黑体，英文、数字和符号使用项目fonts目录里的Inter。本轮只替换字体资源和字体栈，交付1.2.1便携版。

采用Inter在前、Source Han Sans CN在后的字体栈，浏览器按字符选择字形。Inter覆盖的英文、数字、符号使用Inter；汉字及Inter未覆盖的中文标点使用思源黑体。代码区、文件类型标签、时间数字同样使用这一组合。

Inter源于fonts/Inter-4.1/web，使用正体与斜体可变WOFF2。思源黑体采用Adobe官方2.005R的CN子集，内置Regular/Medium/Bold，保留字重层次。两项字体许可证随资源打包。原Open Sans用户源文件保留，仅移除不再使用的发布副本。

官方下载：https://github.com/adobe-fonts/source-han-sans/releases/download/2.005R/19_SourceHanSansCN.zip

- [x] 替换字体及统一文本字体栈。
- [x] 内置字体与许可证。
- [x] 生产编译及打包1.2.1。
- [x] 更新根目录版本化EXE、桌面快捷方式和交付文档。

不运行测试、lint、类型检查、截图比较或启动验证。

