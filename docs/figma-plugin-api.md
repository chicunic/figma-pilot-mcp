# Figma Plugin API Reference

Based on `@figma/plugin-typings` v1.121.0.

## Table of Contents

- [Global Objects](#global-objects)
- [Plugin Lifecycle](#plugin-lifecycle)
- [Node Creation](#node-creation)
- [Node Finding](#node-finding)
- [Event Listening](#event-listening)
- [UI Communication](#ui-communication)
- [Style Management](#style-management)
- [Variable System](#variable-system)
- [Fonts and Text](#fonts-and-text)
- [Images and Media](#images-and-media)
- [Boolean Operations](#boolean-operations)
- [Viewport Control](#viewport-control)
- [Storage](#storage)
- [Utility Functions](#utility-functions)
- [Node Types](#node-types)
- [Mixin Interfaces](#mixin-interfaces)
- [Data Types](#data-types)

---

## Global Objects

| Object     | Description                              |
| ---------- | ---------------------------------------- |
| `figma`    | Plugin API main entry point              |
| `__html__` | UI HTML content defined in manifest.json |

### figma Properties

| Property                        | Type                                                                             | Description                                   |
| ------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------- |
| `apiVersion`                    | `'1.0.0'`                                                                        | API version                                   |
| `command`                       | `string`                                                                         | Current executing command                     |
| `editorType`                    | `'figma' \| 'figjam' \| 'dev' \| 'slides' \| 'buzz'`                             | Editor type                                   |
| `mode`                          | `'default' \| 'textreview' \| 'inspect' \| 'codegen' \| 'linkpreview' \| 'auth'` | Running mode                                  |
| `pluginId`                      | `string`                                                                         | Plugin ID                                     |
| `fileKey`                       | `string \| undefined`                                                            | File Key (requires private plugin permission) |
| `root`                          | `DocumentNode`                                                                   | Document root node                            |
| `currentPage`                   | `PageNode`                                                                       | Current page                                  |
| `currentUser`                   | `User \| null`                                                                   | Current user (requires permission)            |
| `activeUsers`                   | `ActiveUser[]`                                                                   | Active users (FigJam, requires permission)    |
| `mixed`                         | `symbol`                                                                         | Mixed value identifier                        |
| `skipInvisibleInstanceChildren` | `boolean`                                                                        | Skip invisible instance children              |

### Sub APIs

| Property              | Type               | Description                |
| --------------------- | ------------------ | -------------------------- |
| `figma.ui`            | `UIAPI`            | UI communication interface |
| `figma.viewport`      | `ViewportAPI`      | Viewport control           |
| `figma.clientStorage` | `ClientStorageAPI` | Local storage              |
| `figma.parameters`    | `ParametersAPI`    | Parameter handling         |
| `figma.variables`     | `VariablesAPI`     | Variable system            |
| `figma.teamLibrary`   | `TeamLibraryAPI`   | Team library               |
| `figma.codegen`       | `CodegenAPI`       | Code generation            |
| `figma.timer`         | `TimerAPI`         | Timer (FigJam)             |
| `figma.payments`      | `PaymentsAPI`      | Payment features           |
| `figma.util`          | `UtilAPI`          | Utility functions          |
| `figma.constants`     | `ConstantsAPI`     | Constants                  |

---

## Plugin Lifecycle

| Method                                         | Description                           |
| ---------------------------------------------- | ------------------------------------- |
| `closePlugin(message?)`                        | Close plugin, optionally show message |
| `notify(message, options?)`                    | Show notification                     |
| `commitUndo()`                                 | Commit undo point                     |
| `triggerUndo()`                                | Trigger undo                          |
| `saveVersionHistoryAsync(title, description?)` | Save version history                  |
| `openExternal(url)`                            | Open external link                    |

### NotificationOptions

```typescript
interface NotificationOptions {
  timeout?: number; // Timeout in milliseconds, Infinity for never
  error?: boolean; // Whether to show as error style
  onDequeue?: (reason) => void; // Callback when dismissed
  button?: {
    text: string;
    action: () => boolean | void;
  };
}
```

---

## Node Creation

### Basic Shapes

| Method              | Return Type     | Description      |
| ------------------- | --------------- | ---------------- |
| `createRectangle()` | `RectangleNode` | Create rectangle |
| `createEllipse()`   | `EllipseNode`   | Create ellipse   |
| `createPolygon()`   | `PolygonNode`   | Create polygon   |
| `createStar()`      | `StarNode`      | Create star      |
| `createLine()`      | `LineNode`      | Create line      |
| `createVector()`    | `VectorNode`    | Create vector    |

### Containers

| Method                          | Return Type     | Description                |
| ------------------------------- | --------------- | -------------------------- |
| `createFrame()`                 | `FrameNode`     | Create Frame               |
| `createComponent()`             | `ComponentNode` | Create component           |
| `createComponentFromNode(node)` | `ComponentNode` | Create component from node |
| `createPage()`                  | `PageNode`      | Create page                |
| `createSection()`               | `SectionNode`   | Create Section             |
| `createSlice()`                 | `SliceNode`     | Create slice               |

### Text

| Method         | Return Type | Description      |
| -------------- | ----------- | ---------------- |
| `createText()` | `TextNode`  | Create text node |

### FigJam Specific

| Method                      | Return Type         | Description            |
| --------------------------- | ------------------- | ---------------------- |
| `createSticky()`            | `StickyNode`        | Create sticky note     |
| `createConnector()`         | `ConnectorNode`     | Create connector       |
| `createShapeWithText()`     | `ShapeWithTextNode` | Create shape with text |
| `createCodeBlock()`         | `CodeBlockNode`     | Create code block      |
| `createTable(rows?, cols?)` | `TableNode`         | Create table           |

### Slides Specific

| Method                    | Return Type    | Description      |
| ------------------------- | -------------- | ---------------- |
| `createSlide(row?, col?)` | `SlideNode`    | Create slide     |
| `createSlideRow(row?)`    | `SlideRowNode` | Create slide row |

### Advanced Creation

| Method                        | Description                  |
| ----------------------------- | ---------------------------- |
| `createNodeFromSvg(svg)`      | Create node from SVG string  |
| `createNodeFromJSXAsync(jsx)` | Create node from JSX         |
| `createImage(data)`           | Create image from Uint8Array |
| `createImageAsync(url)`       | Create image from URL        |
| `createVideoAsync(data)`      | Create video                 |
| `createLinkPreviewAsync(url)` | Create link preview          |

---

## Node Finding

| Method                      | Description                   |
| --------------------------- | ----------------------------- |
| `getNodeByIdAsync(id)`      | Find node by ID (recommended) |
| `getNodeById(id)`           | Find node by ID (deprecated)  |
| `getStyleByIdAsync(id)`     | Find style by ID              |
| `setCurrentPageAsync(page)` | Set current page              |
| `loadAllPagesAsync()`       | Load all pages                |

### Node Traversal Methods (ChildrenMixin)

| Method                          | Description                         |
| ------------------------------- | ----------------------------------- |
| `children`                      | Children array                      |
| `findAll(callback?)`            | Find all matching nodes             |
| `findOne(callback)`             | Find first matching node            |
| `findChild(callback)`           | Find first matching child           |
| `findChildren(callback)`        | Find all matching children          |
| `findAllWithCriteria(criteria)` | Find by criteria (high performance) |

---

## Event Listening

### Event Types

| Event                                      | Description                      |
| ------------------------------------------ | -------------------------------- |
| `selectionchange`                          | Selection changed                |
| `currentpagechange`                        | Page switched                    |
| `documentchange`                           | Document changed                 |
| `stylechange`                              | Style changed                    |
| `close`                                    | Plugin closed                    |
| `run`                                      | Plugin started (with parameters) |
| `drop`                                     | Drop event                       |
| `textreview`                               | Text review                      |
| `timerstart/stop/pause/resume/done/adjust` | Timer events (FigJam)            |

### Listening Methods

```typescript
figma.on(type, callback); // Continuous listening
figma.once(type, callback); // Listen once
figma.off(type, callback); // Remove listener
```

### DocumentChangeEvent

```typescript
interface DocumentChangeEvent {
  documentChanges: DocumentChange[];
}

type DocumentChange =
  | CreateChange // Node created
  | DeleteChange // Node deleted
  | PropertyChange // Property changed
  | StyleCreateChange // Style created
  | StyleDeleteChange // Style deleted
  | StylePropertyChange; // Style property changed
```

---

## UI Communication

### Show UI

```typescript
figma.showUI(html, options?)

interface ShowUIOptions {
  visible?: boolean      // Whether visible
  width?: number         // Width (default 300)
  height?: number        // Height (default 200)
  title?: string         // Title
  position?: { x, y }    // Position
  themeColors?: boolean  // Theme color CSS variables
}
```

### UIAPI Methods

| Method                           | Description         |
| -------------------------------- | ------------------- |
| `show()`                         | Show UI             |
| `hide()`                         | Hide UI             |
| `resize(width, height)`          | Resize              |
| `reposition(x, y)`               | Reposition          |
| `getPosition()`                  | Get position        |
| `close()`                        | Close UI            |
| `postMessage(message, options?)` | Send message to UI  |
| `onmessage`                      | Receive UI message  |
| `on('message', callback)`        | Listen for messages |

### Communication Example

```typescript
// Plugin side
figma.ui.postMessage({ type: 'data', value: 123 });
figma.ui.onmessage = (msg) => {
  console.log(msg);
};

// UI side
parent.postMessage({ pluginMessage: { type: 'action' } }, '*');
onmessage = (event) => {
  console.log(event.data.pluginMessage);
};
```

---

## Style Management

### Create Styles

| Method                | Return Type   | Description         |
| --------------------- | ------------- | ------------------- |
| `createPaintStyle()`  | `PaintStyle`  | Create paint style  |
| `createTextStyle()`   | `TextStyle`   | Create text style   |
| `createEffectStyle()` | `EffectStyle` | Create effect style |
| `createGridStyle()`   | `GridStyle`   | Create grid style   |

### Get Styles

| Method                        | Description                 |
| ----------------------------- | --------------------------- |
| `getLocalPaintStylesAsync()`  | Get local paint styles      |
| `getLocalTextStylesAsync()`   | Get local text styles       |
| `getLocalEffectStylesAsync()` | Get local effect styles     |
| `getLocalGridStylesAsync()`   | Get local grid styles       |
| `getStyleByIdAsync(id)`       | Get style by ID             |
| `importStyleByKeyAsync(key)`  | Import external style       |
| `getSelectionColors()`        | Get selected element colors |

### Style Ordering

| Method                                         | Description       |
| ---------------------------------------------- | ----------------- |
| `moveLocalPaintStyleAfter(target, reference)`  | Move paint style  |
| `moveLocalTextStyleAfter(target, reference)`   | Move text style   |
| `moveLocalEffectStyleAfter(target, reference)` | Move effect style |
| `moveLocalGridStyleAfter(target, reference)`   | Move grid style   |

---

## Variable System

### VariablesAPI

| Method                                   | Description                |
| ---------------------------------------- | -------------------------- |
| `createVariable(name, collection, type)` | Create variable            |
| `createVariableCollection(name)`         | Create variable collection |
| `createVariableAlias(variable)`          | Create variable alias      |
| `getVariableByIdAsync(id)`               | Get variable by ID         |
| `getVariableCollectionByIdAsync(id)`     | Get collection by ID       |
| `getLocalVariablesAsync(type?)`          | Get local variables        |
| `getLocalVariableCollectionsAsync()`     | Get local collections      |
| `importVariableByKeyAsync(key)`          | Import external variable   |
| `setBoundVariableForPaint(...)`          | Bind color variable        |
| `setBoundVariableForEffect(...)`         | Bind effect variable       |
| `setBoundVariableForLayoutGrid(...)`     | Bind grid variable         |

### Variable Types

```typescript
type VariableResolvedDataType = 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';
```

---

## Fonts and Text

### Font Loading

```typescript
// Load font (must be called before modifying text)
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

// List available fonts
const fonts = await figma.listAvailableFontsAsync();
```

### FontName

```typescript
interface FontName {
  family: string; // Font family
  style: string; // Font style (Regular, Bold, Italic, etc.)
}
```

### Text Properties

| Property              | Type             | Description          |
| --------------------- | ---------------- | -------------------- |
| `characters`          | `string`         | Text content         |
| `fontSize`            | `number`         | Font size            |
| `fontName`            | `FontName`       | Font                 |
| `textCase`            | `TextCase`       | Text case            |
| `textDecoration`      | `TextDecoration` | Text decoration      |
| `letterSpacing`       | `LetterSpacing`  | Letter spacing       |
| `lineHeight`          | `LineHeight`     | Line height          |
| `paragraphIndent`     | `number`         | Paragraph indent     |
| `paragraphSpacing`    | `number`         | Paragraph spacing    |
| `textAlignHorizontal` | `string`         | Horizontal alignment |
| `textAlignVertical`   | `string`         | Vertical alignment   |

---

## Images and Media

### Create Image

```typescript
// Create from binary data
const image = figma.createImage(uint8Array);

// Create from URL
const image = await figma.createImageAsync(url);

// Get existing image
const image = figma.getImageByHash(hash);
```

### Image Interface

| Method            | Description     |
| ----------------- | --------------- |
| `hash`            | Image hash      |
| `getBytesAsync()` | Get binary data |
| `getSizeAsync()`  | Get size        |

### Apply Image Fill

```typescript
node.fills = [
  {
    type: 'IMAGE',
    imageHash: image.hash,
    scaleMode: 'FILL', // FILL, FIT, CROP, TILE
  },
];
```

---

## Boolean Operations

| Method                             | Description |
| ---------------------------------- | ----------- |
| `union(nodes, parent, index?)`     | Union       |
| `subtract(nodes, parent, index?)`  | Subtract    |
| `intersect(nodes, parent, index?)` | Intersect   |
| `exclude(nodes, parent, index?)`   | Exclude     |

### Other Operations

| Method                                     | Description         |
| ------------------------------------------ | ------------------- |
| `group(nodes, parent, index?)`             | Group               |
| `ungroup(node)`                            | Ungroup             |
| `flatten(nodes, parent, index?)`           | Flatten             |
| `combineAsVariants(nodes, parent, index?)` | Combine as variants |

---

## Viewport Control

### ViewportAPI

| Property/Method                | Description                               |
| ------------------------------ | ----------------------------------------- |
| `center`                       | Viewport center `{ x, y }`                |
| `zoom`                         | Zoom level                                |
| `bounds`                       | Viewport bounds `{ x, y, width, height }` |
| `scrollAndZoomIntoView(nodes)` | Scroll and zoom to nodes                  |

---

## Storage

### ClientStorageAPI

```typescript
// Read
const value = await figma.clientStorage.getAsync(key);

// Write
await figma.clientStorage.setAsync(key, value);

// Delete
await figma.clientStorage.deleteAsync(key);

// List all keys
const keys = await figma.clientStorage.keysAsync();
```

---

## Utility Functions

### UtilAPI

| Method                          | Description         |
| ------------------------------- | ------------------- |
| `rgb(color)`                    | Parse color to RGB  |
| `rgba(color)`                   | Parse color to RGBA |
| `solidPaint(color, overrides?)` | Create solid paint  |
| `normalizeMarkdown(markdown)`   | Normalize Markdown  |

### Example

```typescript
const rgb = figma.util.rgb('#FF0000'); // { r: 1, g: 0, b: 0 }
const paint = figma.util.solidPaint('#FF0000');
```

### Encoding Utilities

| Method               | Description          |
| -------------------- | -------------------- |
| `base64Encode(data)` | Uint8Array to Base64 |
| `base64Decode(data)` | Base64 to Uint8Array |

---

## Node Types

### SceneNode (Scene Nodes)

| Type                   | Description              |
| ---------------------- | ------------------------ |
| `FrameNode`            | Frame                    |
| `GroupNode`            | Group                    |
| `ComponentNode`        | Component                |
| `ComponentSetNode`     | Component set (variants) |
| `InstanceNode`         | Component instance       |
| `RectangleNode`        | Rectangle                |
| `EllipseNode`          | Ellipse                  |
| `PolygonNode`          | Polygon                  |
| `StarNode`             | Star                     |
| `LineNode`             | Line                     |
| `VectorNode`           | Vector                   |
| `TextNode`             | Text                     |
| `BooleanOperationNode` | Boolean operation        |
| `SliceNode`            | Slice                    |
| `SectionNode`          | Section                  |

### FigJam Nodes

| Type                | Description     |
| ------------------- | --------------- |
| `StickyNode`        | Sticky note     |
| `ConnectorNode`     | Connector       |
| `ShapeWithTextNode` | Shape with text |
| `CodeBlockNode`     | Code block      |
| `TableNode`         | Table           |
| `TableCellNode`     | Table cell      |
| `StampNode`         | Stamp           |
| `HighlightNode`     | Highlight       |
| `WashiTapeNode`     | Washi tape      |

### Special Nodes

| Type             | Description        |
| ---------------- | ------------------ |
| `DocumentNode`   | Document root node |
| `PageNode`       | Page               |
| `EmbedNode`      | Embedded content   |
| `LinkUnfurlNode` | Link preview       |
| `MediaNode`      | Media              |
| `WidgetNode`     | Widget             |

---

## Mixin Interfaces

Mixins are reusable property sets that different node types combine.

### Common Mixins

| Mixin             | Description                                       |
| ----------------- | ------------------------------------------------- |
| `BaseNodeMixin`   | Base properties (id, name, removed, etc.)         |
| `SceneNodeMixin`  | Scene node properties (visible, locked, etc.)     |
| `ChildrenMixin`   | Children operations                               |
| `LayoutMixin`     | Layout properties (x, y, width, height, rotation) |
| `GeometryMixin`   | Geometry properties (fills, strokes)              |
| `BlendMixin`      | Blend properties (opacity, blendMode)             |
| `CornerMixin`     | Corner radius properties                          |
| `ConstraintMixin` | Constraint properties                             |
| `ExportMixin`     | Export functionality                              |

### LayoutMixin Properties

| Property         | Type     | Description        |
| ---------------- | -------- | ------------------ |
| `x`              | `number` | X coordinate       |
| `y`              | `number` | Y coordinate       |
| `width`          | `number` | Width (read-only)  |
| `height`         | `number` | Height (read-only) |
| `rotation`       | `number` | Rotation angle     |
| `resize(w, h)`   | Method   | Resize             |
| `rescale(scale)` | Method   | Scale              |

### GeometryMixin Properties

| Property       | Type       | Description       |
| -------------- | ---------- | ----------------- |
| `fills`        | `Paint[]`  | Fills             |
| `strokes`      | `Paint[]`  | Strokes           |
| `strokeWeight` | `number`   | Stroke weight     |
| `strokeAlign`  | `string`   | Stroke alignment  |
| `strokeCap`    | `string`   | Stroke cap style  |
| `strokeJoin`   | `string`   | Stroke join style |
| `dashPattern`  | `number[]` | Dash pattern      |

### Auto Layout (FrameNode)

| Property                       | Type                                   | Description            |
| ------------------------------ | -------------------------------------- | ---------------------- |
| `layoutMode`                   | `'NONE' \| 'HORIZONTAL' \| 'VERTICAL'` | Layout mode            |
| `primaryAxisAlignItems`        | `string`                               | Primary axis alignment |
| `counterAxisAlignItems`        | `string`                               | Counter axis alignment |
| `itemSpacing`                  | `number`                               | Item spacing           |
| `paddingTop/Right/Bottom/Left` | `number`                               | Padding                |

---

## Data Types

### Paint (Fill)

```typescript
type Paint = SolidPaint | GradientPaint | ImagePaint | VideoPaint | PatternPaint;

interface SolidPaint {
  type: 'SOLID';
  color: RGB;
  opacity?: number;
  visible?: boolean;
  blendMode?: BlendMode;
}

interface GradientPaint {
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND';
  gradientStops: ColorStop[];
  gradientTransform: Transform;
}

interface ImagePaint {
  type: 'IMAGE';
  imageHash: string | null;
  scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
}
```

### Effect

```typescript
type Effect = DropShadowEffect | InnerShadowEffect | BlurEffect | NoiseEffect | GlassEffect | TextureEffect;

interface DropShadowEffect {
  type: 'DROP_SHADOW';
  color: RGBA;
  offset: Vector;
  radius: number;
  spread?: number;
  visible?: boolean;
  blendMode?: BlendMode;
}

interface BlurEffect {
  type: 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  radius: number;
  visible?: boolean;
}
```

### Color

```typescript
interface RGB {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
}

interface RGBA extends RGB {
  a: number; // 0-1
}
```

### Transform

```typescript
type Transform = [[number, number, number], [number, number, number]];

interface Vector {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### Export

```typescript
interface ExportSettingsImage {
  format: 'JPG' | 'PNG' | 'WEBP';
  constraint?: { type: 'SCALE' | 'WIDTH' | 'HEIGHT'; value: number };
}

interface ExportSettingsSVG {
  format: 'SVG';
  svgOutlineText?: boolean;
  svgIdAttribute?: boolean;
}

interface ExportSettingsPDF {
  format: 'PDF';
}

// Usage
const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
```

---

## Permissions and Manifest

Some APIs require permissions declared in `manifest.json`:

```json
{
  "permissions": [
    "currentuser", // Access current user
    "activeusers", // Access active users (FigJam)
    "payments" // Payment features
  ],
  "capabilities": [
    "textreview", // Text review
    "codegen" // Code generation
  ],
  "enablePrivatePluginApi": true, // Private API (e.g., fileKey)
  "documentAccess": "dynamic-page" // Dynamic page access
}
```

---

## Common Patterns

### Create Rectangle with Fill

```typescript
const rect = figma.createRectangle();
rect.x = 100;
rect.y = 100;
rect.resize(200, 100);
rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }];
rect.cornerRadius = 8;
```

### Create Text

```typescript
const text = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
text.characters = 'Hello, Figma!';
text.fontSize = 24;
text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
```

### Traverse All Nodes

```typescript
function traverse(node: BaseNode) {
  console.log(node.name);
  if ('children' in node) {
    for (const child of node.children) {
      traverse(child);
    }
  }
}
traverse(figma.currentPage);
```

### Find Specific Node Types

```typescript
const textNodes = figma.currentPage.findAllWithCriteria({ types: ['TEXT'] });
const frames = figma.currentPage.findAll((n) => n.type === 'FRAME' && n.name.startsWith('Card'));
```

### Listen to Selection Changes

```typescript
figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;
  console.log(
    'Selected:',
    selection.map((n) => n.name)
  );
});
```

---

## Reference Links

- [Official API Documentation](https://developers.figma.com/docs/plugins/api/)
- [Plugin Samples](https://github.com/figma/plugin-samples)
- [Plugin Typings](https://github.com/figma/plugin-typings)
