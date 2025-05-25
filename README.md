# trans-diff

从XLIFF文件创建可过滤、可评论的差异表

[TransDiff 在线](https://lucaslucky.github.io)

## 支持文件

文件:
- [x] 支持单个文件 xlf, xliff, sdlxliff, txlf, mqxliff, tmx, txt
- [x] 不支持多个文件（检测文件ID），但可以使用工具 (rainbow, disfr) 合并 xlf, tmx文件
新增功能：
1. TXT 文件支持 ✅

按行分割对比
自动跳过空行
每行作为一个对比单元

2. DOCX 文件支持 ⚠️ (有限)

全文对比
尝试提取Word文档中的文本内容
简单解析XML结构中的 <w:t> 标签

3. XLSX 文件支持 ⚠️ (非常有限)

按行对比
尝试从共享字符串表提取文本
只处理第一个工作表的文本内容

4. TMX 文件支持✅

重要限制说明：
DOCX 解析限制：

只能提取基本的文本内容
无法处理复杂的格式、表格、图片等
对于加密或复杂结构的DOCX可能失败

XLSX 解析限制：

极其有限的解析能力
只能提取共享字符串中的文本
无法处理公式、数字、日期等
无法保证单元格的正确顺序

使用建议：

TXT 文件：完全支持，效果最好
DOCX 文件：建议先转换为TXT格式再对比
XLSX 文件：建议导出为CSV或TXT格式再对比

改进建议：
如果你需要更好的 DOCX/XLSX 支持，我建议：

使用专门的转换工具将文件转为TXT格式
或者考虑引入 mammoth.js（DOCX）和 SheetJS（XLSX）库
对于翻译工作流，通常推荐使用专门的翻译格式（XLF/TMX）

这个版本应该能满足你的基本需求，特别是TXT格式的对比会非常准确。DOCX和XLSX的支持虽然有限，但可以作为应急使用。


### 如何生成 diff 文件

非常简单。
1. 在审查开始和结束时导出 XFF 文件。
  - 对于 Transifex，点击“以 XLIFF 格式下载以进行翻译”（或当源文件是 XLIFF 文件时点击“下载以使用”）
  - 对于 memoQ，点击“导出” > “导出双语”，并取消选择“保存压缩文件 (.mqxlz)”
1. 选择 XLIFF 文件（文件1和文件2），然后点击“比较”。diff 文件将自动下载。

支持的文件类型：

- .xlf ([XLIFF 版本 1.2](http://docs.oasis-open.orgliff/v1.2/os/xliff-core.html))
- .mqxliff (.mqxlz 当前不支持)
- .mxliff
- .sdlxliff
- .txlf
- .tmx
- .txt
  

Diff 规格：

- diff 是基于 [Levenshtein 距离](https://en.wikipedia.org/wiki/Lehtein_distance)
- 比较对于全角字符（例如日语）是基于字符的，半角字符（例如英语）是基于单词的

限制：

- 基本，文件1和文件2之间的段/字符串数量需要相同。

### 如何使用差异文件

标题：
- 使用更改/未更改状态过滤差异表。
- 展开或折叠标签内容。
- 如果您的电脑处于深色模式，差异文件将以深色模式打开。您可以手动开启或关闭深色模式。
- 单击“保存静态视图”以保存当前过滤后的视图，不包含JavaScript，可以减少文件大小并提高安全性。静态文件不可评论或过滤。
- 单击“重新保存文件”以保存完整的文件。
- 使用文本过滤（包含文本、不包含文本、匹配正则表达式、不匹配正则表达式，以及在数字范围内）。详细信息请将鼠标悬停在每一行的最左列。例如，您可以通过在“注释”列上方的正则表达式行中输入一个点“.”来仅显示带有任何注释的段落。
- 单击“清除过滤器”以清除过滤器中的所有文本。

表格：
- 单击“▼”或文件名以隐藏该文件的表格。
- 左键单击表头以按列对表格进行排序。
- 右键单击表头以隐藏其他列。这对于将列复制粘贴到文本编辑器中非常有用。
- 单击“注释”列以添加注释。评论后请记得通过按Ctrl/Cmd+S键或单击“重新保存文件”来重新保存文件。

### 下载XLIFF文件

Trans Diff有一个Transifex URL转换器。编辑器的URL `https://app.transifex.com/{organization}/{project}/translate/#{lang}/{resource}/{stringId}?{query}` 被转换为 `https://app.transifex.com/{organization}/{project}/{resource}`，您可以通过选择您的语言并按下“下载翻译为XLIFF”按钮来下载XLIFF文件。在您在Tranifex中进行翻译或审查之前和之后，下载XLIFF文件非常有用。*请注意，这不是Transifex的官方功能。*

使用方法：

- 将Transifex编辑器URL粘贴到转换器（看起来像终端/命令提示符），*将光标移动到行尾*，然后按Enter键下载XLIFF文件。
- 您可以通过按向上箭头键引用之前的输入。

## 动机与灵感

最初我想比较.mqxlz文件，但由于在客户端JavaScript中实现解压缩文件的代码较为棘手，项目一直处于休眠状态。似乎.mqxlz是ZIP64格式。
最近我经常使用Transifex XLIFF文件，因此我恢复了这个项目。
我受到了[AlissaSabre](https://github.com/AlissaSabre)的差异工具的高度启发和激励，尽管它不在GitHub上。

## 许可证

任何人都可以免费使用此工具。

[MIT许可证](https://github.com/ShunSakurai/trans-diff/blob/master/LICENSE)

## 隐私政策和使用条款

我们不会存储您的数据。我们物理上无法存储。（部分内容借鉴自[这里](https://github.com/amitg87/asana-chrome-plugin/wiki/Privacy-policy)。）所有操作都在您计算机上的客户端JavaScript中完成。

我尽力维护此扩展的质量和安全性，但请自行承担使用风险。作者不对因使用此工具造成的任何损害负责。
