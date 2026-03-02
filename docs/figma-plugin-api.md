# Figma Plugin API Reference

Based on `@figma/plugin-typings` v1.123.0. Updated March 2026.

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
- [Annotations](#annotations)
- [Viewport Control](#viewport-control)
- [Storage](#storage)
- [Utility Functions](#utility-functions)
- [Node Types](#node-types)
- [Mixin Interfaces](#mixin-interfaces)
- [Data Types](#data-types)

---

## Global Objects

| Object | Description |
| - | - |
| `figma` | Plugin API main entry point |
| `__html__` | UI HTML content defined in manifest.json |

### figma Properties

| Property | Type | Description |
| - | - | - |
| `apiVersion` | `'1.0.0'` | API version |
| `command` | `string` | Current executing command |
| `editorType` | `'figma' \| 'figjam' \| 'dev' \| 'slides' \| 'buzz'` | Editor type |
| `mode` | `'default' \| 'textreview' \| 'inspect' \| 'codegen' \| 'linkpreview' \| 'auth'` | Running mode |
| `pluginId` | `string` | Plugin ID |
| `fileKey` | `string \| undefined` | File Key (requires private plugin permission) |
| `root` | `DocumentNode` | Document root node |
| `currentPage` | `PageNode` | Current page |
| `currentUser` | `User \| null` | Current user (requires permission) |
| `activeUsers` | `ActiveUser[]` | Active users (FigJam, requires permission) |
| `mixed` | `symbol` | Mixed value identifier |
| `skipInvisibleInstanceChildren` | `boolean` | Skip invisible instance children |

### Sub APIs

| Property | Type | Description |
| - | - | - |
| `figma.ui` | `UIAPI` | UI communication interface |
| `figma.viewport` | `ViewportAPI` | Viewport control |
| `figma.clientStorage` | `ClientStorageAPI` | Local storage |
| `figma.parameters` | `ParametersAPI` | Parameter handling |
| `figma.variables` | `VariablesAPI` | Variable system |
| `figma.teamLibrary` | `TeamLibraryAPI` | Team library |
| `figma.codegen` | `CodegenAPI` | Code generation |
| `figma.timer` | `TimerAPI` | Timer (FigJam) |
| `figma.payments` | `PaymentsAPI` | Payment features |
| `figma.util` | `UtilAPI` | Utility functions |
| `figma.constants` | `ConstantsAPI` | Constants |
| `figma.annotations` | `AnnotationsAPI` | Annotations |
| `figma.buzz` | `BuzzAPI` | Buzz (FigJam) |

### Global Functions

| Function | Description |
| - | - |
| `fetch(url, options)` | Network requests (Promise-based) |

---

## Plugin Lifecycle

| Method | Description |
| - | - |
| `closePlugin(message?)` | Close plugin, optionally show message |
| `notify(message, options?)` | Show notification |
| `commitUndo()` | Commit undo point |
| `triggerUndo()` | Trigger undo |
| `saveVersionHistoryAsync(title, description?)` | Save version history |
| `openExternal(url)` | Open external link |

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

| Method | Return Type | Description |
| - | - | - |
| `createRectangle()` | `RectangleNode` | Create rectangle |
| `createEllipse()` | `EllipseNode` | Create ellipse |
| `createPolygon()` | `PolygonNode` | Create polygon |
| `createStar()` | `StarNode` | Create star |
| `createLine()` | `LineNode` | Create line |
| `createVector()` | `VectorNode` | Create vector |

### Containers

| Method | Return Type | Description |
| - | - | - |
| `createFrame()` | `FrameNode` | Create Frame |
| `createComponent()` | `ComponentNode` | Create component |
| `createComponentFromNode(node)` | `ComponentNode` | Create component from node |
| `createPage()` | `PageNode` | Create page |
| `createPageDivider()` | `PageDividerNode` | Create page divider |
| `createSection()` | `SectionNode` | Create Section |
| `createSlice()` | `SliceNode` | Create slice |

### Text

| Method | Return Type | Description |
| - | - | - |
| `createText()` | `TextNode` | Create text node |
| `createTextPath()` | `TextPathNode` | Create text path node |

### FigJam Specific

| Method | Return Type | Description |
| - | - | - |
| `createSticky()` | `StickyNode` | Create sticky note |
| `createConnector()` | `ConnectorNode` | Create connector |
| `createShapeWithText()` | `ShapeWithTextNode` | Create shape with text |
| `createCodeBlock()` | `CodeBlockNode` | Create code block |
| `createTable(rows?, cols?)` | `TableNode` | Create table |

### Slides Specific

| Method | Return Type | Description |
| - | - | - |
| `createSlide(row?, col?)` | `SlideNode` | Create slide |
| `createSlideRow(row?)` | `SlideRowNode` | Create slide row |

### Advanced Creation

| Method | Description |
| - | - |
| `createNodeFromSvg(svg)` | Create node from SVG string |
| `createNodeFromJSXAsync(jsx)` | Create node from JSX |
| `createBooleanOperation()` | Create boolean operation node |
| `createImage(data)` | Create image from Uint8Array |
| `createImageAsync(url)` | Create image from URL |
| `createGif(data)` | Create GIF |
| `createVideoAsync(data)` | Create video |
| `createLinkPreviewAsync(url)` | Create link preview |

---

## Node Finding

| Method | Description |
| - | - |
| `getNodeByIdAsync(id)` | Find node by ID (recommended) |
| `getNodeById(id)` | Find node by ID (deprecated) |
| `getStyleByIdAsync(id)` | Find style by ID |
| `setCurrentPageAsync(page)` | Set current page |
| `loadAllPagesAsync()` | Load all pages |

### Node Traversal Methods (ChildrenMixin)

| Method | Description |
| - | - |
| `children` | Children array |
| `findAll(callback?)` | Find all matching nodes |
| `findOne(callback)` | Find first matching node |
| `findChild(callback)` | Find first matching child |
| `findChildren(callback)` | Find all matching children |
| `findAllWithCriteria(criteria)` | Find by criteria (high performance) |

---

## Event Listening

### Event Types

| Event | Description |
| - | - |
| `selectionchange` | Selection changed |
| `currentpagechange` | Page switched |
| `documentchange` | Document changed |
| `stylechange` | Style changed |
| `close` | Plugin closed |
| `run` | Plugin started (with parameters) |
| `drop` | Drop event |
| `textreview` | Text review |
| `timerstart/stop/pause/resume/done/adjust` | Timer events (FigJam) |

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

| Method | Description |
| - | - |
| `show()` | Show UI |
| `hide()` | Hide UI |
| `resize(width, height)` | Resize |
| `reposition(x, y)` | Reposition |
| `getPosition()` | Get position |
| `close()` | Close UI |
| `postMessage(message, options?)` | Send message to UI |
| `onmessage` | Receive UI message |
| `on('message', callback)` | Listen for messages |

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

| Method | Return Type | Description |
| - | - | - |
| `createPaintStyle()` | `PaintStyle` | Create paint style |
| `createTextStyle()` | `TextStyle` | Create text style |
| `createEffectStyle()` | `EffectStyle` | Create effect style |
| `createGridStyle()` | `GridStyle` | Create grid style |

### Get Styles

| Method | Description |
| - | - |
| `getLocalPaintStylesAsync()` | Get local paint styles |
| `getLocalTextStylesAsync()` | Get local text styles |
| `getLocalEffectStylesAsync()` | Get local effect styles |
| `getLocalGridStylesAsync()` | Get local grid styles |
| `getStyleByIdAsync(id)` | Get style by ID |
| `importStyleByKeyAsync(key)` | Import external style |
| `getSelectionColors()` | Get selected element colors |

### Style Ordering

| Method | Description |
| - | - |
| `moveLocalPaintStyleAfter(target, reference)` | Move paint style |
| `moveLocalTextStyleAfter(target, reference)` | Move text style |
| `moveLocalEffectStyleAfter(target, reference)` | Move effect style |
| `moveLocalGridStyleAfter(target, reference)` | Move grid style |

---

## Variable System

### VariablesAPI

| Method | Description |
| - | - |
| `createVariable(name, collection, type)` | Create variable |
| `createVariableCollection(name)` | Create variable collection |
| `createVariableAlias(variable)` | Create variable alias |
| `getVariableByIdAsync(id)` | Get variable by ID |
| `getVariableCollectionByIdAsync(id)` | Get collection by ID |
| `getLocalVariablesAsync(type?)` | Get local variables |
| `getLocalVariableCollectionsAsync()` | Get local collections |
| `importVariableByKeyAsync(key)` | Import external variable |
| `setBoundVariableForPaint(...)` | Bind color variable |
| `setBoundVariableForEffect(...)` | Bind effect variable |
| `setBoundVariableForLayoutGrid(...)` | Bind grid variable |

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

| Property | Type | Description |
| - | - | - |
| `characters` | `string` | Text content |
| `fontSize` | `number` | Font size |
| `fontName` | `FontName` | Font |
| `textCase` | `TextCase` | Text case |
| `textDecoration` | `TextDecoration` | Text decoration |
| `letterSpacing` | `LetterSpacing` | Letter spacing |
| `lineHeight` | `LineHeight` | Line height |
| `paragraphIndent` | `number` | Paragraph indent |
| `paragraphSpacing` | `number` | Paragraph spacing |
| `textAlignHorizontal` | `string` | Horizontal alignment |
| `textAlignVertical` | `string` | Vertical alignment |

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

| Method | Description |
| - | - |
| `hash` | Image hash |
| `getBytesAsync()` | Get binary data |
| `getSizeAsync()` | Get size |

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

### ImageFilters

Applied via `ImagePaint.filters`:

```typescript
interface ImageFilters {
  exposure?: number;    // Image exposure adjustment
  contrast?: number;    // Contrast adjustment
  saturation?: number;  // Saturation adjustment
  temperature?: number; // Color temperature
  tint?: number;        // Color tint
  highlights?: number;  // Highlights adjustment
  shadows?: number;     // Shadows adjustment
}

// Usage
node.fills = [
  {
    type: 'IMAGE',
    imageHash: image.hash,
    scaleMode: 'FILL',
    filters: { exposure: 0.2, contrast: 0.1, saturation: -0.3 },
  },
];
```

### Image Transform (CROP mode)

```typescript
node.fills = [
  {
    type: 'IMAGE',
    imageHash: image.hash,
    scaleMode: 'CROP',
    imageTransform: [[1, 0, 0], [0, 1, 0]], // Transform matrix for crop positioning
  },
];
```

---

## Boolean Operations

| Method | Description |
| - | - |
| `union(nodes, parent, index?)` | Union |
| `subtract(nodes, parent, index?)` | Subtract |
| `intersect(nodes, parent, index?)` | Intersect |
| `exclude(nodes, parent, index?)` | Exclude |
| `createBooleanOperation()` | Create empty boolean op node |

### Other Operations

| Method | Description |
| - | - |
| `group(nodes, parent, index?)` | Group |
| `transformGroup(nodes, parent, index?)` | Transform group |
| `ungroup(node)` | Ungroup |
| `flatten(nodes, parent, index?)` | Flatten |
| `combineAsVariants(nodes, parent, index?)` | Combine as variants |

---

## Annotations

### AnnotationsAPI

```typescript
// Annotations can be set on nodes
node.annotations; // Read annotations

interface Annotation {
  properties: AnnotationProperty[];
  label?: string;
}

interface AnnotationProperty {
  readonly type: AnnotationPropertyType;
}
```

### AnnotationPropertyType Values

Dimensional: `width`, `height`, `maxWidth`, `minWidth`, `maxHeight`, `minHeight`
Visual: `fills`, `strokes`, `effects`, `strokeWeight`, `cornerRadius`, `opacity`
Text: `textStyleId`, `textAlignHorizontal`, `fontFamily`, `fontStyle`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`
Layout: `itemSpacing`, `padding`, `layoutMode`, `alignItems`
Grid: `gridRowGap`, `gridColumnGap`, `gridRowCount`, `gridColumnCount`, `gridRowAnchorIndex`, `gridColumnAnchorIndex`, `gridRowSpan`, `gridColumnSpan`
Component: `mainComponent`

---

## Viewport Control

### ViewportAPI

| Property/Method | Description |
| - | - |
| `center` | Viewport center `{ x, y }` |
| `zoom` | Zoom level |
| `bounds` | Viewport bounds `{ x, y, width, height }` |
| `scrollAndZoomIntoView(nodes)` | Scroll and zoom to nodes |

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

| Method | Description |
| - | - |
| `rgb(color)` | Parse color to RGB |
| `rgba(color)` | Parse color to RGBA |
| `solidPaint(color, overrides?)` | Create solid paint |
| `normalizeMarkdown(markdown)` | Normalize Markdown |

### Example

```typescript
const rgb = figma.util.rgb('#FF0000'); // { r: 1, g: 0, b: 0 }
const paint = figma.util.solidPaint('#FF0000');
```

### Encoding Utilities

| Method | Description |
| - | - |
| `base64Encode(data)` | Uint8Array to Base64 |
| `base64Decode(data)` | Base64 to Uint8Array |

---

## Node Types

### SceneNode (Scene Nodes)

| Type | Description |
| - | - |
| `FrameNode` | Frame |
| `GroupNode` | Group |
| `ComponentNode` | Component |
| `ComponentSetNode` | Component set (variants) |
| `InstanceNode` | Component instance |
| `RectangleNode` | Rectangle |
| `EllipseNode` | Ellipse |
| `PolygonNode` | Polygon |
| `StarNode` | Star |
| `LineNode` | Line |
| `VectorNode` | Vector |
| `TextNode` | Text |
| `TextPathNode` | Text path |
| `BooleanOperationNode` | Boolean operation |
| `SliceNode` | Slice |
| `SectionNode` | Section |

### FigJam Nodes

| Type | Description |
| - | - |
| `StickyNode` | Sticky note |
| `ConnectorNode` | Connector |
| `ShapeWithTextNode` | Shape with text |
| `CodeBlockNode` | Code block |
| `TableNode` | Table |
| `TableCellNode` | Table cell |
| `StampNode` | Stamp |
| `HighlightNode` | Highlight |
| `WashiTapeNode` | Washi tape |

### FigJam Node Details

#### StickyNode

| Property | Type | Description |
| - | - | - |
| `type` | `'STICKY'` | Node type (read-only) |
| `text` | `TextSublayerNode` | Text sublayer (read-only) |
| `authorVisible` | `boolean` | Author field visibility |
| `authorName` | `string` | Creator's name |
| `isWideWidth` | `boolean` | Rectangular (true) or square |
| `fills` | `Paint[]` | Fill colors |

#### ConnectorNode

| Property | Type | Description |
| - | - | - |
| `type` | `'CONNECTOR'` | Node type (read-only) |
| `text` | `TextSublayerNode` | Text sublayer (read-only) |
| `textBackground` | `LabelSublayerNode` | Text background sublayer |
| `connectorLineType` | `'ELBOWED' \| 'STRAIGHT' \| 'CURVED'` | Path style |
| `connectorStart` | `ConnectorEndpoint` | Start point |
| `connectorEnd` | `ConnectorEndpoint` | End point |
| `connectorStartStrokeCap` | `ConnectorStrokeCap` | Start cap style |
| `connectorEndStrokeCap` | `ConnectorStrokeCap` | End cap style |
| `cornerRadius` | `number` | Edge rounding (read-only) |
| `strokes` | `Paint[]` | Stroke paints |
| `strokeWeight` | `number` | Thickness |
| `dashPattern` | `number[]` | Dash pattern |

#### ShapeWithTextNode

| Property | Type | Description |
| - | - | - |
| `type` | `'SHAPE_WITH_TEXT'` | Node type (read-only) |
| `shapeType` | `ShapeType` | Geometric form (31 types) |
| `text` | `TextSublayerNode` | Text sublayer (read-only) |
| `fills` | `Paint[]` | Fill colors |

ShapeType values: `SQUARE`, `ELLIPSE`, `ROUNDED_RECTANGLE`, `DIAMOND`, `TRIANGLE_UP`, `TRIANGLE_DOWN`, `PARALLELOGRAM_RIGHT`, `PARALLELOGRAM_LEFT`, `ENG_DATABASE`, `ENG_QUEUE`, `ENG_FILE`, `ENG_FOLDER`, `TRAPEZOID`, `PREDEFINED_PROCESS`, `SHIELD`, `DOCUMENT_SINGLE`, `DOCUMENT_MULTIPLE`, `MANUAL_INPUT`, `HEXAGON`, `CHEVRON`, `PENTAGON`, `OCTAGON`, `STAR`, `PLUS`, `ARROW_LEFT`, `ARROW_RIGHT`, `SUMMING_JUNCTION`, `OR`, `SPEECH_BUBBLE`, `INTERNAL_STORAGE`

#### TableNode

| Method | Description |
| - | - |
| `numRows` | Row count (read-only) |
| `numColumns` | Column count (read-only) |
| `cellAt(rowIndex, columnIndex)` | Get cell at coordinates |
| `insertRow(rowIndex)` | Insert row |
| `insertColumn(columnIndex)` | Insert column |
| `removeRow(rowIndex)` | Remove row |
| `removeColumn(columnIndex)` | Remove column |
| `moveRow(fromIndex, toIndex)` | Move row |
| `moveColumn(fromIndex, toIndex)` | Move column |
| `resizeRow(rowIndex, height)` | Resize row |
| `resizeColumn(columnIndex, width)` | Resize column |

### Special Nodes

| Type | Description |
| - | - |
| `DocumentNode` | Document root node |
| `PageNode` | Page |
| `EmbedNode` | Embedded content |
| `LinkUnfurlNode` | Link preview |
| `MediaNode` | Media |
| `WidgetNode` | Widget |

---

## Mixin Interfaces

Mixins are reusable property sets that different node types combine.

### Common Mixins

| Mixin | Description |
| - | - |
| `BaseNodeMixin` | Base properties (id, name, removed, etc.) |
| `SceneNodeMixin` | Scene node properties (visible, locked, etc.) |
| `ChildrenMixin` | Children operations |
| `LayoutMixin` | Layout properties (x, y, width, height, rotation) |
| `GeometryMixin` | Geometry properties (fills, strokes) |
| `BlendMixin` | Blend properties (opacity, blendMode) |
| `CornerMixin` | Corner radius properties |
| `ConstraintMixin` | Constraint properties |
| `ExportMixin` | Export functionality |

### LayoutMixin Properties

| Property | Type | Description |
| - | - | - |
| `x` | `number` | X coordinate |
| `y` | `number` | Y coordinate |
| `width` | `number` | Width (read-only) |
| `height` | `number` | Height (read-only) |
| `rotation` | `number` | Rotation angle |
| `resize(w, h)` | Method | Resize |
| `rescale(scale)` | Method | Scale |

### GeometryMixin Properties

| Property | Type | Description |
| - | - | - |
| `fills` | `Paint[]` | Fills |
| `strokes` | `Paint[]` | Strokes |
| `strokeWeight` | `number` | Stroke weight |
| `strokeAlign` | `string` | Stroke alignment |
| `strokeCap` | `string` | Stroke cap style |
| `strokeJoin` | `string` | Stroke join style |
| `dashPattern` | `number[]` | Dash pattern |

### Auto Layout (FrameNode)

| Property | Type | Description |
| - | - | - |
| `layoutMode` | `'NONE' \| 'HORIZONTAL' \| 'VERTICAL'` | Layout mode |
| `primaryAxisAlignItems` | `string` | Primary axis alignment |
| `counterAxisAlignItems` | `string` | Counter axis alignment |
| `itemSpacing` | `number` | Item spacing |
| `paddingTop/Right/Bottom/Left` | `number` | Padding |

---

## Data Types

### Paint (Fill)

```typescript
type Paint = SolidPaint | GradientPaint | ImagePaint | VideoPaint | PatternPaint;

// Common properties shared by all Paint types
interface PaintBase {
  visible?: boolean;   // Visibility (default: true)
  opacity?: number;    // 0-1 (default: 1)
  blendMode?: BlendMode; // Blend mode (default: 'NORMAL')
}

interface SolidPaint extends PaintBase {
  type: 'SOLID';
  color: RGB;
  boundVariables?: object;
}

interface GradientPaint extends PaintBase {
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND';
  gradientStops: ColorStop[];
  gradientTransform: Transform;
}

interface ColorStop {
  position: number; // 0-1
  color: RGBA;
  boundVariables?: object;
}

interface ImagePaint extends PaintBase {
  type: 'IMAGE';
  imageHash: string | null;
  scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  imageTransform?: Transform;   // Positioning for CROP mode
  scalingFactor?: number;       // For TILE mode repetition
  rotation?: number;            // In 90-degree increments
  filters?: ImageFilters;       // Exposure, contrast, saturation, etc.
}

interface VideoPaint extends PaintBase {
  type: 'VIDEO';
  videoHash: string | null;
  scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
}

interface PatternPaint extends PaintBase { // Beta
  type: 'PATTERN';
  sourceNodeId: string;
  tileType: string;
  scalingFactor?: number;
  spacing?: number;
  horizontalAlignment?: string;
}
```

### Gradient Examples

```typescript
// Linear gradient (left to right, red to blue)
node.fills = [
  {
    type: 'GRADIENT_LINEAR',
    gradientStops: [
      { position: 0, color: { r: 1, g: 0, b: 0, a: 1 } },
      { position: 1, color: { r: 0, g: 0, b: 1, a: 1 } },
    ],
    gradientTransform: [[1, 0, 0], [0, 1, 0]],
  },
];

// Radial gradient
node.fills = [
  {
    type: 'GRADIENT_RADIAL',
    gradientStops: [
      { position: 0, color: { r: 1, g: 1, b: 1, a: 1 } },
      { position: 1, color: { r: 0, g: 0, b: 0, a: 1 } },
    ],
    gradientTransform: [[0.5, 0, 0.25], [0, 0.5, 0.25]],
  },
];
```

### Effect

```typescript
type Effect = DropShadowEffect | InnerShadowEffect | BlurEffect | NoiseEffect | GlassEffect | TextureEffect;

interface DropShadowEffect {
  type: 'DROP_SHADOW';
  color: RGBA;
  offset: Vector;
  radius: number;   // >= 0
  spread?: number;   // default 0
  visible?: boolean;
  blendMode?: BlendMode;
  showShadowBehindNode?: boolean; // default false
}

interface InnerShadowEffect {
  type: 'INNER_SHADOW';
  color: RGBA;
  offset: Vector;
  radius: number;
  spread?: number;   // positive value contracts shadow
  visible?: boolean;
  blendMode?: BlendMode;
}

interface BlurEffect {
  type: 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  radius: number; // >= 0
  visible?: boolean;
}

// Beta effects:
interface NoiseEffect {
  type: 'NOISE';
  // Variants: Monotone, Duotone, Multitone
  color: RGBA;
  noiseSize: number;
  density: number;
  blendMode?: BlendMode;
  visible?: boolean;
}

interface GlassEffect {  // Beta
  type: 'GLASS';
  lightIntensity: number;
  lightAngle: number;
  refraction: number;
  depth: number;
  dispersion: number;
  radius: number;
  visible?: boolean;
}

interface TextureEffect {  // Beta
  type: 'TEXTURE';
  noiseSize: number;
  radius: number;
  clipToShape: boolean;
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
    "currentuser",
    "activeusers",
    "payments"
  ],
  "capabilities": [
    "textreview",
    "codegen"
  ],
  "enablePrivatePluginApi": true,
  "documentAccess": "dynamic-page"
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

### Create Gradient Fill

```typescript
const rect = figma.createRectangle();
rect.resize(300, 200);
rect.fills = [
  {
    type: 'GRADIENT_LINEAR',
    gradientStops: [
      { position: 0, color: { r: 1, g: 0.2, b: 0.5, a: 1 } },
      { position: 0.5, color: { r: 0.5, g: 0, b: 1, a: 1 } },
      { position: 1, color: { r: 0, g: 0.5, b: 1, a: 1 } },
    ],
    gradientTransform: [[1, 0, 0], [0, 1, 0]],
  },
];
```

### Create Image with Filters

```typescript
const image = await figma.createImageAsync('https://example.com/photo.jpg');
const rect = figma.createRectangle();
rect.resize(400, 300);
rect.fills = [
  {
    type: 'IMAGE',
    imageHash: image.hash,
    scaleMode: 'FILL',
    filters: { contrast: 0.2, saturation: -0.5, temperature: 0.1 },
  },
];
```

### Create Text

```typescript
const text = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
text.characters = 'Hello, Figma!';
text.fontSize = 24;
text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
```

### Create FigJam Sticky

```typescript
const sticky = figma.createSticky();
await figma.loadFontAsync(sticky.text.fontName as FontName);
sticky.text.characters = 'My note';
sticky.fills = [{ type: 'SOLID', color: { r: 1, g: 0.95, b: 0.6 } }];
```

### Create FigJam Connector

```typescript
const connector = figma.createConnector();
connector.connectorLineType = 'ELBOWED';
connector.connectorStart = { endpointNodeId: nodeA.id, magnet: 'AUTO' };
connector.connectorEnd = { endpointNodeId: nodeB.id, magnet: 'AUTO' };
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
- [API Reference](https://developers.figma.com/docs/plugins/api/api-reference/)
- [Plugin Samples](https://github.com/figma/plugin-samples)
- [Plugin Typings](https://github.com/figma/plugin-typings)
