// Figma Pilot Plugin - Main Code
// Figma plugin that communicates with MCP server via UI thread

// ========== Type Definitions ==========

interface CommandMessage {
  id: string;
  command: string;
  params: Record<string, unknown>;
}

interface NodeInfo {
  id: string;
  name: string;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  rotation?: number;
}

// ========== Event Subscription State ==========

const eventSubscriptions: {
  selectionchange: boolean;
  currentpagechange: boolean;
  documentchange: boolean;
  stylechange: boolean;
} = {
  selectionchange: false,
  currentpagechange: false,
  documentchange: false,
  stylechange: false,
};

// ========== Constants ==========

function sanitizeChannelName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w-]/g, '-') // Replace non-word chars (except -) with -
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Trim leading/trailing dashes
}

const FILE_CHANNEL = `figma-pilot-${figma.fileKey || sanitizeChannelName(figma.root.name) || 'local'}`;

// ========== Helper Functions ==========

async function appendToParent(node: SceneNode, parentId?: string): Promise<void> {
  if (parentId) {
    const parent = await figma.getNodeByIdAsync(parentId);
    if (parent && 'appendChild' in parent) {
      (parent as ChildrenMixin).appendChild(node);
    }
  }
}

async function getNode(nodeId: string, requiredProp: string): Promise<BaseNode> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || !(requiredProp in node)) {
    throw new Error(`Node not found or missing property: ${requiredProp}`);
  }
  return node;
}

async function getSceneNode(nodeId: string): Promise<SceneNode> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || node.type === 'DOCUMENT' || node.type === 'PAGE') {
    throw new Error('Node not found or not a scene node');
  }
  return node as SceneNode;
}

async function getSceneNodes(nodeIds: string[]): Promise<SceneNode[]> {
  const nodes: SceneNode[] = [];
  for (const id of nodeIds) {
    nodes.push(await getSceneNode(id));
  }
  return nodes;
}

async function getTextNode(nodeId: string): Promise<TextNode> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || node.type !== 'TEXT') throw new Error('Node not found or not a text node');
  return node as TextNode;
}

async function loadTextFont(node: TextNode): Promise<void> {
  const fontName = node.fontName;
  if (fontName === figma.mixed) throw new Error('Mixed fonts not supported');
  await figma.loadFontAsync(fontName);
}

function getNodesParent(nodes: SceneNode[]): ChildrenMixin & BaseNode {
  if (nodes.length === 0) throw new Error('No nodes provided');
  const parent = nodes[0]!.parent;
  if (!parent || !('children' in parent)) throw new Error('Cannot operate on nodes without valid parent');
  return parent as ChildrenMixin & BaseNode;
}

type BooleanOperation = (nodes: SceneNode[], parent: ChildrenMixin & BaseNode) => BooleanOperationNode;

async function performBooleanOperation(
  nodeIds: string[],
  operation: BooleanOperation,
  minNodes = 2,
): Promise<{ id: string; name: string }> {
  const nodes = await getSceneNodes(nodeIds);
  if (nodes.length < minNodes) throw new Error(`Need at least ${minNodes} nodes for boolean operation`);
  const result = operation(nodes, getNodesParent(nodes));
  return { id: result.id, name: result.name };
}

type LocalStyleType = 'PAINT' | 'TEXT' | 'EFFECT' | 'GRID';
type AnyLocalStyle = PaintStyle | TextStyle | EffectStyle | GridStyle;

async function moveStyleAfter<T extends AnyLocalStyle>(
  targetStyleId: string,
  referenceStyleId: string | undefined,
  styleType: LocalStyleType,
  moveFn: (target: T, reference: T | null) => void,
): Promise<{ moved: boolean; targetId: string }> {
  const target = await figma.getStyleByIdAsync(targetStyleId);
  if (!target || target.type !== styleType) throw new Error(`Target ${styleType.toLowerCase()} style not found`);

  let reference: T | null = null;
  if (referenceStyleId) {
    const ref = await figma.getStyleByIdAsync(referenceStyleId);
    if (!ref || ref.type !== styleType) throw new Error(`Reference ${styleType.toLowerCase()} style not found`);
    reference = ref as T;
  }

  moveFn(target as T, reference);
  return { moved: true, targetId: target.id };
}

function getTopFrame(node: BaseNode): FrameNode | ComponentNode | null {
  let current: BaseNode | null = node;
  let topFrame: FrameNode | ComponentNode | null = null;

  while (current && current.type !== 'PAGE') {
    if (current.type === 'FRAME' || current.type === 'COMPONENT') {
      topFrame = current as FrameNode | ComponentNode;
    }
    current = current.parent;
  }

  return topFrame;
}

function serializeNode(node: SceneNode, includeDetails = false): NodeInfo {
  const info: NodeInfo = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if ('x' in node) info.x = node.x;
  if ('y' in node) info.y = node.y;
  if ('width' in node) info.width = node.width;
  if ('height' in node) info.height = node.height;

  if (includeDetails) {
    if ('visible' in node) info.visible = node.visible;
    if ('locked' in node) info.locked = node.locked;
    if ('opacity' in node) info.opacity = node.opacity;
    if ('rotation' in node) info.rotation = node.rotation;
  }

  return info;
}

function matchName(nodeName: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    return regex.test(nodeName);
  }
  return nodeName === pattern;
}

// Node tree definition for create_node_tree
interface NodeTreeDef {
  type: string;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  cornerRadius?: number;
  opacity?: number;
  rotation?: number;
  visible?: boolean;
  locked?: boolean;
  characters?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  children?: NodeTreeDef[];
}

interface CreatedNodeInfo {
  id: string;
  name: string;
  type: string;
  children?: CreatedNodeInfo[];
}

async function createNodeFromDef(def: NodeTreeDef, parent?: ChildrenMixin): Promise<SceneNode> {
  let node: SceneNode;

  // Create node based on type
  switch (def.type.toUpperCase()) {
    case 'FRAME':
      node = figma.createFrame();
      break;
    case 'RECTANGLE':
      node = figma.createRectangle();
      break;
    case 'ELLIPSE':
      node = figma.createEllipse();
      break;
    case 'POLYGON':
      node = figma.createPolygon();
      break;
    case 'STAR':
      node = figma.createStar();
      break;
    case 'LINE':
      node = figma.createLine();
      break;
    case 'VECTOR':
      node = figma.createVector();
      break;
    case 'TEXT':
      node = figma.createText();
      break;
    case 'COMPONENT':
      node = figma.createComponent();
      break;
    default:
      throw new Error(`Unsupported node type: ${def.type}`);
  }

  // Set basic properties
  if (def.name) node.name = def.name;
  if (def.x !== undefined) node.x = def.x;
  if (def.y !== undefined) node.y = def.y;
  if (def.width !== undefined && def.height !== undefined) {
    node.resize(def.width, def.height);
  }
  if (def.visible !== undefined) node.visible = def.visible;
  if (def.locked !== undefined) node.locked = def.locked;

  // Geometry properties
  if ('fills' in node && def.fills) {
    (node as GeometryMixin).fills = def.fills;
  }
  if ('strokes' in node && def.strokes) {
    (node as GeometryMixin).strokes = def.strokes;
  }
  if ('strokeWeight' in node && def.strokeWeight !== undefined) {
    (node as GeometryMixin).strokeWeight = def.strokeWeight;
  }

  // Corner radius
  if ('cornerRadius' in node && def.cornerRadius !== undefined) {
    (node as CornerMixin).cornerRadius = def.cornerRadius;
  }

  // Blend properties
  if ('opacity' in node && def.opacity !== undefined) {
    (node as BlendMixin).opacity = def.opacity;
  }

  // Rotation
  if ('rotation' in node && def.rotation !== undefined) {
    (node as LayoutMixin).rotation = def.rotation;
  }

  // Text properties
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    const fontFamily = def.fontFamily || 'Inter';
    const fontStyle = def.fontStyle || 'Regular';
    await figma.loadFontAsync({ family: fontFamily, style: fontStyle });

    if (def.characters) textNode.characters = def.characters;
    if (def.fontSize) textNode.fontSize = def.fontSize;
    if (def.textAlignHorizontal) textNode.textAlignHorizontal = def.textAlignHorizontal;
  }

  // Auto layout properties (Frame only)
  if (node.type === 'FRAME' || node.type === 'COMPONENT') {
    const frameNode = node as FrameNode | ComponentNode;
    if (def.layoutMode) frameNode.layoutMode = def.layoutMode;
    if (def.primaryAxisAlignItems) frameNode.primaryAxisAlignItems = def.primaryAxisAlignItems;
    if (def.counterAxisAlignItems) frameNode.counterAxisAlignItems = def.counterAxisAlignItems;
    if (def.itemSpacing !== undefined) frameNode.itemSpacing = def.itemSpacing;
    if (def.paddingTop !== undefined) frameNode.paddingTop = def.paddingTop;
    if (def.paddingRight !== undefined) frameNode.paddingRight = def.paddingRight;
    if (def.paddingBottom !== undefined) frameNode.paddingBottom = def.paddingBottom;
    if (def.paddingLeft !== undefined) frameNode.paddingLeft = def.paddingLeft;
  }

  // Append to parent
  if (parent) {
    parent.appendChild(node);
  }

  // Create children recursively
  if (def.children && 'appendChild' in node) {
    for (const childDef of def.children) {
      await createNodeFromDef(childDef, node as ChildrenMixin);
    }
  }

  return node;
}

function serializeCreatedTree(node: SceneNode): CreatedNodeInfo {
  const info: CreatedNodeInfo = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if ('children' in node && (node as ChildrenMixin).children.length > 0) {
    info.children = (node as ChildrenMixin).children.map((child) => serializeCreatedTree(child as SceneNode));
  }

  return info;
}

// ========== Command Handler Map ==========

type CommandHandler = (params: Record<string, unknown>) => Promise<unknown>;

const commandHandlers: Record<string, CommandHandler> = {
  // ==================== Create Commands ====================

  create_frame: async (p) => {
    const frame = figma.createFrame();
    frame.name = (p.name as string) || 'Frame';
    frame.x = (p.x as number) || 0;
    frame.y = (p.y as number) || 0;
    frame.resize((p.width as number) || 100, (p.height as number) || 100);
    await appendToParent(frame, p.parentId as string);
    return { id: frame.id, name: frame.name };
  },

  create_rectangle: async (p) => {
    const rect = figma.createRectangle();
    rect.name = (p.name as string) || 'Rectangle';
    rect.x = (p.x as number) || 0;
    rect.y = (p.y as number) || 0;
    rect.resize((p.width as number) || 100, (p.height as number) || 100);
    await appendToParent(rect, p.parentId as string);
    return { id: rect.id, name: rect.name };
  },

  create_ellipse: async (p) => {
    const ellipse = figma.createEllipse();
    ellipse.name = (p.name as string) || 'Ellipse';
    ellipse.x = (p.x as number) || 0;
    ellipse.y = (p.y as number) || 0;
    ellipse.resize((p.width as number) || 100, (p.height as number) || 100);
    await appendToParent(ellipse, p.parentId as string);
    return { id: ellipse.id, name: ellipse.name };
  },

  create_polygon: async (p) => {
    const polygon = figma.createPolygon();
    polygon.name = (p.name as string) || 'Polygon';
    polygon.x = (p.x as number) || 0;
    polygon.y = (p.y as number) || 0;
    polygon.pointCount = (p.pointCount as number) || 3;
    polygon.resize((p.width as number) || 100, (p.height as number) || 100);
    await appendToParent(polygon, p.parentId as string);
    return { id: polygon.id, name: polygon.name };
  },

  create_star: async (p) => {
    const star = figma.createStar();
    star.name = (p.name as string) || 'Star';
    star.x = (p.x as number) || 0;
    star.y = (p.y as number) || 0;
    star.pointCount = (p.pointCount as number) || 5;
    star.innerRadius = (p.innerRadius as number) || 0.4;
    star.resize((p.width as number) || 100, (p.height as number) || 100);
    await appendToParent(star, p.parentId as string);
    return { id: star.id, name: star.name };
  },

  create_line: async (p) => {
    const line = figma.createLine();
    line.name = (p.name as string) || 'Line';
    line.x = (p.x as number) || 0;
    line.y = (p.y as number) || 0;
    line.resize((p.length as number) || 100, 0);
    if (p.rotation) line.rotation = p.rotation as number;
    await appendToParent(line, p.parentId as string);
    return { id: line.id, name: line.name };
  },

  create_vector: async (p) => {
    const vector = figma.createVector();
    vector.name = (p.name as string) || 'Vector';
    vector.x = (p.x as number) || 0;
    vector.y = (p.y as number) || 0;
    if (p.vectorPaths) vector.vectorPaths = p.vectorPaths as VectorPaths;
    await appendToParent(vector, p.parentId as string);
    return { id: vector.id, name: vector.name };
  },

  create_text: async (p) => {
    const text = figma.createText();
    const fontFamily = (p.fontFamily as string) || 'Inter';
    const fontStyle = (p.fontStyle as string) || 'Regular';
    await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
    text.fontName = { family: fontFamily, style: fontStyle };
    text.characters = (p.characters as string) || '';
    text.x = (p.x as number) || 0;
    text.y = (p.y as number) || 0;
    if (p.fontSize) text.fontSize = p.fontSize as number;
    await appendToParent(text, p.parentId as string);
    return { id: text.id, characters: text.characters };
  },

  create_component: async (p) => {
    const component = figma.createComponent();
    component.name = (p.name as string) || 'Component';
    component.x = (p.x as number) || 0;
    component.y = (p.y as number) || 0;
    component.resize((p.width as number) || 100, (p.height as number) || 100);
    await appendToParent(component, p.parentId as string);
    return { id: component.id, name: component.name, key: component.key };
  },

  create_component_from_node: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    const component = figma.createComponentFromNode(node);
    return { id: component.id, name: component.name, key: component.key };
  },

  create_component_instance: async (p) => {
    const component = await figma.importComponentByKeyAsync(p.componentKey as string);
    const instance = component.createInstance();
    instance.x = (p.x as number) || 0;
    instance.y = (p.y as number) || 0;
    await appendToParent(instance, p.parentId as string);
    return { id: instance.id, name: instance.name };
  },

  create_page: async (p) => {
    const page = figma.createPage();
    page.name = (p.name as string) || 'New Page';
    return { id: page.id, name: page.name };
  },

  create_section: async (p) => {
    const section = figma.createSection();
    section.name = (p.name as string) || 'Section';
    section.x = (p.x as number) || 0;
    section.y = (p.y as number) || 0;
    section.resizeWithoutConstraints((p.width as number) || 400, (p.height as number) || 400);
    return { id: section.id, name: section.name };
  },

  create_slice: async (p) => {
    const slice = figma.createSlice();
    slice.name = (p.name as string) || 'Slice';
    slice.x = (p.x as number) || 0;
    slice.y = (p.y as number) || 0;
    slice.resize((p.width as number) || 100, (p.height as number) || 100);
    await appendToParent(slice, p.parentId as string);
    return { id: slice.id, name: slice.name };
  },

  create_from_svg: async (p) => {
    const node = figma.createNodeFromSvg(p.svg as string);
    node.name = (p.name as string) || 'SVG';
    node.x = (p.x as number) || 0;
    node.y = (p.y as number) || 0;
    await appendToParent(node, p.parentId as string);
    return { id: node.id, name: node.name };
  },

  create_image: async (p) => {
    const imageData = figma.base64Decode(p.base64 as string);
    const image = figma.createImage(imageData);
    const rect = figma.createRectangle();
    rect.name = (p.name as string) || 'Image';
    rect.x = (p.x as number) || 0;
    rect.y = (p.y as number) || 0;
    rect.resize((p.width as number) || 100, (p.height as number) || 100);
    rect.fills = [
      { type: 'IMAGE', imageHash: image.hash, scaleMode: (p.scaleMode as 'FILL' | 'FIT' | 'CROP' | 'TILE') || 'FILL' },
    ];
    await appendToParent(rect, p.parentId as string);
    return { id: rect.id, name: rect.name, imageHash: image.hash };
  },

  // ==================== Modify Commands ====================

  set_fill_color: async (p) => {
    const node = await getNode(p.nodeId as string, 'fills');
    const opacity = p.a !== undefined ? (p.a as number) : 1;
    (node as GeometryMixin).fills = [
      { type: 'SOLID', color: { r: p.r as number, g: p.g as number, b: p.b as number }, opacity: opacity },
    ];
    return { id: node.id };
  },

  set_stroke_color: async (p) => {
    const node = await getNode(p.nodeId as string, 'strokes');
    const geo = node as GeometryMixin;
    const opacity = p.a !== undefined ? (p.a as number) : 1;
    geo.strokes = [
      { type: 'SOLID', color: { r: p.r as number, g: p.g as number, b: p.b as number }, opacity: opacity },
    ];
    geo.strokeWeight = (p.strokeWeight as number) || 1;
    return { id: node.id };
  },

  set_corner_radius: async (p) => {
    const node = await getNode(p.nodeId as string, 'cornerRadius');
    (node as CornerMixin).cornerRadius = p.radius as number;
    return { id: node.id };
  },

  set_individual_corner_radius: async (p) => {
    const node = await getNode(p.nodeId as string, 'topLeftRadius');
    const corner = node as RectangleCornerMixin;
    if (p.topLeft !== undefined) corner.topLeftRadius = p.topLeft as number;
    if (p.topRight !== undefined) corner.topRightRadius = p.topRight as number;
    if (p.bottomLeft !== undefined) corner.bottomLeftRadius = p.bottomLeft as number;
    if (p.bottomRight !== undefined) corner.bottomRightRadius = p.bottomRight as number;
    return { id: node.id };
  },

  move_node: async (p) => {
    const node = await getNode(p.nodeId as string, 'x');
    const scene = node as SceneNode;
    scene.x = p.x as number;
    scene.y = p.y as number;
    return { id: node.id, x: scene.x, y: scene.y };
  },

  resize_node: async (p) => {
    const node = await getNode(p.nodeId as string, 'resize');
    (node as LayoutMixin).resize(p.width as number, p.height as number);
    return { id: node.id, width: p.width, height: p.height };
  },

  set_rotation: async (p) => {
    const node = await getNode(p.nodeId as string, 'rotation');
    (node as LayoutMixin).rotation = p.rotation as number;
    return { id: node.id, rotation: p.rotation };
  },

  set_opacity: async (p) => {
    const node = await getNode(p.nodeId as string, 'opacity');
    (node as BlendMixin).opacity = p.opacity as number;
    return { id: node.id, opacity: p.opacity };
  },

  set_blend_mode: async (p) => {
    const node = await getNode(p.nodeId as string, 'blendMode');
    (node as BlendMixin).blendMode = p.blendMode as BlendMode;
    return { id: node.id, blendMode: p.blendMode };
  },

  set_visible: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    node.visible = p.visible as boolean;
    return { id: node.id, visible: node.visible };
  },

  set_locked: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    node.locked = p.locked as boolean;
    return { id: node.id, locked: node.locked };
  },

  set_name: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node) throw new Error('Node not found');
    node.name = p.name as string;
    return { id: node.id, name: node.name };
  },

  set_auto_layout: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node || node.type !== 'FRAME') throw new Error('Node not found or not a frame');
    const frame = node as FrameNode;

    if (p.mode === 'NONE') {
      frame.layoutMode = 'NONE';
    } else {
      frame.layoutMode = p.mode as 'HORIZONTAL' | 'VERTICAL';
      frame.primaryAxisAlignItems = (p.primaryAxisAlignItems as 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN') || 'MIN';
      frame.counterAxisAlignItems = (p.counterAxisAlignItems as 'MIN' | 'CENTER' | 'MAX' | 'BASELINE') || 'MIN';
      frame.itemSpacing = p.itemSpacing !== undefined ? (p.itemSpacing as number) : 0;
      if (p.padding) {
        const pad = p.padding as Record<string, number>;
        frame.paddingTop = pad.top !== undefined ? pad.top : 0;
        frame.paddingRight = pad.right !== undefined ? pad.right : 0;
        frame.paddingBottom = pad.bottom !== undefined ? pad.bottom : 0;
        frame.paddingLeft = pad.left !== undefined ? pad.left : 0;
      }
      if (p.primaryAxisSizingMode) frame.primaryAxisSizingMode = p.primaryAxisSizingMode as 'FIXED' | 'AUTO';
      if (p.counterAxisSizingMode) frame.counterAxisSizingMode = p.counterAxisSizingMode as 'FIXED' | 'AUTO';
    }
    return { id: node.id, layoutMode: frame.layoutMode };
  },

  set_constraints: async (p) => {
    const node = await getNode(p.nodeId as string, 'constraints');
    const constraint = node as ConstraintMixin;
    constraint.constraints = {
      horizontal: (p.horizontal as ConstraintType) || 'MIN',
      vertical: (p.vertical as ConstraintType) || 'MIN',
    };
    return { id: node.id };
  },

  set_effects: async (p) => {
    const node = await getNode(p.nodeId as string, 'effects');
    (node as BlendMixin).effects = p.effects as Effect[];
    return { id: node.id };
  },

  add_drop_shadow: async (p) => {
    const node = await getNode(p.nodeId as string, 'effects');
    const blend = node as BlendMixin;
    const shadow: DropShadowEffect = {
      type: 'DROP_SHADOW',
      color: {
        r: p.r !== undefined ? (p.r as number) : 0,
        g: p.g !== undefined ? (p.g as number) : 0,
        b: p.b !== undefined ? (p.b as number) : 0,
        a: p.a !== undefined ? (p.a as number) : 0.25,
      },
      offset: {
        x: p.offsetX !== undefined ? (p.offsetX as number) : 0,
        y: p.offsetY !== undefined ? (p.offsetY as number) : 4,
      },
      radius: p.radius !== undefined ? (p.radius as number) : 4,
      spread: p.spread !== undefined ? (p.spread as number) : 0,
      visible: true,
      blendMode: 'NORMAL',
    };
    blend.effects = [...blend.effects, shadow];
    return { id: node.id };
  },

  add_blur: async (p) => {
    const node = await getNode(p.nodeId as string, 'effects');
    const blend = node as BlendMixin;
    const blur: BlurEffect = {
      type: (p.type as 'LAYER_BLUR' | 'BACKGROUND_BLUR') || 'LAYER_BLUR',
      blurType: 'NORMAL',
      radius: p.radius !== undefined ? (p.radius as number) : 10,
      visible: true,
    };
    blend.effects = [...blend.effects, blur];
    return { id: node.id };
  },

  clear_effects: async (p) => {
    const node = await getNode(p.nodeId as string, 'effects');
    (node as BlendMixin).effects = [];
    return { id: node.id };
  },

  delete_node: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node) throw new Error('Node not found');
    const id = node.id;
    node.remove();
    return { id, deleted: true };
  },

  clone_node: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    const clone = node.clone();
    if (p.x !== undefined) clone.x = p.x as number;
    if (p.y !== undefined) clone.y = p.y as number;
    if (p.name) clone.name = p.name as string;
    return { id: clone.id, name: clone.name };
  },

  // ==================== Group Commands ====================

  group_nodes: async (p) => {
    const nodes = await getSceneNodes(p.nodeIds as string[]);
    if (nodes.length === 0) throw new Error('No nodes to group');
    const group = figma.group(nodes, getNodesParent(nodes));
    if (p.name) group.name = p.name as string;
    return { id: group.id, name: group.name };
  },

  ungroup_node: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node || node.type !== 'GROUP') throw new Error('Node not found or not a group');
    const group = node as GroupNode;
    const childIds = group.children.map((c) => c.id);
    figma.ungroup(group);
    return { ungrouped: true, childIds };
  },

  flatten_node: async (p) => {
    const nodes = await getSceneNodes(p.nodeIds as string[]);
    if (nodes.length === 0) throw new Error('No nodes to flatten');
    const flattened = figma.flatten(nodes, getNodesParent(nodes));
    return { id: flattened.id, name: flattened.name };
  },

  // ==================== Boolean Operations ====================

  boolean_union: async (p) => performBooleanOperation(p.nodeIds as string[], figma.union),
  boolean_subtract: async (p) => performBooleanOperation(p.nodeIds as string[], figma.subtract),
  boolean_intersect: async (p) => performBooleanOperation(p.nodeIds as string[], figma.intersect),
  boolean_exclude: async (p) => performBooleanOperation(p.nodeIds as string[], figma.exclude),

  // ==================== Text Commands ====================

  set_text_content: async (p) => {
    const node = await getTextNode(p.nodeId as string);
    await loadTextFont(node);
    node.characters = p.characters as string;
    return { id: node.id, characters: node.characters };
  },

  set_font_size: async (p) => {
    const node = await getTextNode(p.nodeId as string);
    await loadTextFont(node);
    node.fontSize = p.fontSize as number;
    return { id: node.id, fontSize: node.fontSize };
  },

  set_font_name: async (p) => {
    const node = await getTextNode(p.nodeId as string);
    const fontName: FontName = {
      family: p.family as string,
      style: (p.style as string) || 'Regular',
    };
    await figma.loadFontAsync(fontName);
    node.fontName = fontName;
    return { id: node.id, fontName };
  },

  set_font_weight: async (p) => {
    const node = await getTextNode(p.nodeId as string);
    const weightToStyle: Record<number, string> = {
      100: 'Thin',
      200: 'ExtraLight',
      300: 'Light',
      400: 'Regular',
      500: 'Medium',
      600: 'SemiBold',
      700: 'Bold',
      800: 'ExtraBold',
      900: 'Black',
    };
    const currentFont = node.fontName;
    if (currentFont === figma.mixed) throw new Error('Mixed fonts not supported');
    const style = weightToStyle[p.fontWeight as number] || 'Regular';
    const fontName: FontName = { family: currentFont.family, style };
    await figma.loadFontAsync(fontName);
    node.fontName = fontName;
    return { id: node.id, fontWeight: p.fontWeight };
  },

  set_text_color: async (p) => {
    const node = await getTextNode(p.nodeId as string);
    const opacity = p.a !== undefined ? (p.a as number) : 1;
    node.fills = [{ type: 'SOLID', color: { r: p.r as number, g: p.g as number, b: p.b as number }, opacity: opacity }];
    return { id: node.id };
  },

  set_line_height: async (p) => {
    const node = await getTextNode(p.nodeId as string);
    await loadTextFont(node);
    if (p.unit === 'AUTO') {
      node.lineHeight = { unit: 'AUTO' };
    } else {
      node.lineHeight = { unit: p.unit as 'PIXELS' | 'PERCENT', value: p.lineHeight as number };
    }
    return { id: node.id };
  },

  set_letter_spacing: async (p) => {
    const node = await getTextNode(p.nodeId as string);
    await loadTextFont(node);
    node.letterSpacing = { unit: p.unit as 'PIXELS' | 'PERCENT', value: p.letterSpacing as number };
    return { id: node.id };
  },

  set_text_align: async (p) => {
    const node = await getTextNode(p.nodeId as string);
    await loadTextFont(node);
    if (p.horizontal) node.textAlignHorizontal = p.horizontal as 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
    if (p.vertical) node.textAlignVertical = p.vertical as 'TOP' | 'CENTER' | 'BOTTOM';
    return { id: node.id };
  },

  set_text_decoration: async (p) => {
    const node = await getTextNode(p.nodeId as string);
    await loadTextFont(node);
    node.textDecoration = p.decoration as 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
    return { id: node.id };
  },

  set_text_case: async (p) => {
    const node = await getTextNode(p.nodeId as string);
    await loadTextFont(node);
    node.textCase = p.textCase as 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS' | 'SMALL_CAPS_FORCED';
    return { id: node.id };
  },

  // ==================== Query Commands ====================

  get_node: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node) throw new Error('Node not found');

    const info: Record<string, unknown> = {
      id: node.id,
      name: node.name,
      type: node.type,
    };

    if ('x' in node) info.x = node.x;
    if ('y' in node) info.y = node.y;
    if ('width' in node) info.width = node.width;
    if ('height' in node) info.height = node.height;
    if ('visible' in node) info.visible = node.visible;
    if ('locked' in node) info.locked = node.locked;
    if ('opacity' in node) info.opacity = node.opacity;
    if ('rotation' in node) info.rotation = node.rotation;
    if ('fills' in node) info.fills = node.fills;
    if ('strokes' in node) info.strokes = node.strokes;
    if ('strokeWeight' in node) info.strokeWeight = node.strokeWeight;
    if ('cornerRadius' in node) info.cornerRadius = node.cornerRadius;
    if ('characters' in node) info.characters = node.characters;
    if ('fontSize' in node) info.fontSize = node.fontSize;
    if ('fontName' in node) info.fontName = node.fontName;
    if ('effects' in node) info.effects = node.effects;
    if ('constraints' in node) info.constraints = node.constraints;
    if ('layoutMode' in node) info.layoutMode = node.layoutMode;
    if ('children' in node) info.childCount = node.children.length;
    if ('absoluteBoundingBox' in node) info.absoluteBoundingBox = node.absoluteBoundingBox;

    return info;
  },

  get_selection: async () => {
    const selection = figma.currentPage.selection;
    return {
      count: selection.length,
      nodes: selection.map((node) => serializeNode(node, true)),
    };
  },

  get_current_page: async () => {
    const page = figma.currentPage;
    return {
      id: page.id,
      name: page.name,
      childCount: page.children.length,
      backgroundColor: page.backgrounds,
    };
  },

  get_pages: async () => {
    const pages = figma.root.children;
    return {
      count: pages.length,
      pages: pages.map((p) => ({ id: p.id, name: p.name, childCount: p.children.length })),
    };
  },

  set_current_page: async (p) => {
    const page = await figma.getNodeByIdAsync(p.pageId as string);
    if (!page || page.type !== 'PAGE') throw new Error('Page not found');
    await figma.setCurrentPageAsync(page as PageNode);
    return { id: page.id, name: page.name };
  },

  find_nodes: async (p) => {
    const typeFilter = p.type as string | undefined;
    const namePattern = p.name as string | undefined;
    let searchRoot: ChildrenMixin = figma.currentPage;

    if (p.parentId) {
      const parent = await figma.getNodeByIdAsync(p.parentId as string);
      if (!parent || !('children' in parent)) throw new Error('Parent not found or has no children');
      searchRoot = parent as ChildrenMixin;
    }

    let nodes: SceneNode[];

    if (typeFilter) {
      nodes = searchRoot.findAllWithCriteria({ types: [typeFilter as NodeType] });
    } else {
      nodes = searchRoot.findAll() as SceneNode[];
    }

    if (namePattern) {
      nodes = nodes.filter((n) => matchName(n.name, namePattern));
    }

    const limit = (p.limit as number) || 100;
    const limited = nodes.slice(0, limit);

    return {
      count: nodes.length,
      returned: limited.length,
      nodes: limited.map((n) => serializeNode(n)),
    };
  },

  get_children: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node || !('children' in node)) throw new Error('Node not found or has no children');

    const depth = (p.depth as number) || 1;
    const includeDetails = (p.includeDetails as boolean) || false;

    function getChildrenRecursive(parent: ChildrenMixin, currentDepth: number): NodeInfo[] {
      if (currentDepth > depth) return [];
      return parent.children.map((child) => {
        const info = serializeNode(child as SceneNode, includeDetails);
        if ('children' in child && currentDepth < depth) {
          (info as NodeInfo & { children?: NodeInfo[] }).children = getChildrenRecursive(
            child as ChildrenMixin,
            currentDepth + 1,
          );
        }
        return info;
      });
    }

    return {
      id: node.id,
      children: getChildrenRecursive(node as ChildrenMixin, 1),
    };
  },

  get_top_frame: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node) throw new Error('Node not found');
    const topFrame = getTopFrame(node);
    if (!topFrame) return { topFrame: null };
    return {
      topFrame: {
        id: topFrame.id,
        name: topFrame.name,
        type: topFrame.type,
        x: topFrame.x,
        y: topFrame.y,
        width: topFrame.width,
        height: topFrame.height,
      },
    };
  },

  get_local_styles: async (p) => {
    const styleType = p.type as string | undefined;
    const styles: Array<{ id: string; name: string; type: string; key: string }> = [];

    if (!styleType || styleType === 'PAINT') {
      const paintStyles = await figma.getLocalPaintStylesAsync();
      styles.push(...paintStyles.map((s) => ({ id: s.id, name: s.name, type: 'PAINT', key: s.key })));
    }
    if (!styleType || styleType === 'TEXT') {
      const textStyles = await figma.getLocalTextStylesAsync();
      styles.push(...textStyles.map((s) => ({ id: s.id, name: s.name, type: 'TEXT', key: s.key })));
    }
    if (!styleType || styleType === 'EFFECT') {
      const effectStyles = await figma.getLocalEffectStylesAsync();
      styles.push(...effectStyles.map((s) => ({ id: s.id, name: s.name, type: 'EFFECT', key: s.key })));
    }
    if (!styleType || styleType === 'GRID') {
      const gridStyles = await figma.getLocalGridStylesAsync();
      styles.push(...gridStyles.map((s) => ({ id: s.id, name: s.name, type: 'GRID', key: s.key })));
    }

    return { count: styles.length, styles };
  },

  get_local_components: async (p) => {
    const components: Array<Record<string, unknown>> = [];
    const searchAllPages = p.allPages as boolean | undefined;

    function getPageName(node: BaseNode): string {
      let current: BaseNode | null = node;
      while (current && current.type !== 'PAGE') {
        current = current.parent;
      }
      return current ? current.name : '';
    }

    function getParentPath(node: BaseNode): string {
      const path: string[] = [];
      let current: BaseNode | null = node.parent;
      while (current && current.type !== 'PAGE') {
        path.unshift(current.name);
        current = current.parent;
      }
      return path.join('/');
    }

    function findComponents(node: BaseNode) {
      if (node.type === 'COMPONENT') {
        const comp = node as ComponentNode;
        const parent = comp.parent;
        const isVariant = parent && parent.type === 'COMPONENT_SET';

        let componentPropertyDefinitions: Record<string, unknown> | undefined;
        let variantProperties: Record<string, string> | null | undefined;

        if (!isVariant) {
          try {
            const props = comp.componentPropertyDefinitions;
            if (props && Object.keys(props).length > 0) {
              componentPropertyDefinitions = props;
            }
          } catch {
            // Ignore errors
          }
        } else {
          try {
            variantProperties = comp.variantProperties;
          } catch {
            // Ignore errors for broken variant sets
          }
        }

        components.push({
          id: comp.id,
          name: comp.name,
          key: comp.key,
          description: comp.description,
          remote: comp.remote,
          page: getPageName(comp),
          parentPath: getParentPath(comp),
          isVariant,
          variantProperties,
          componentSetName: isVariant && parent ? parent.name : undefined,
          width: comp.width,
          height: comp.height,
          componentPropertyDefinitions,
        });
      }
      if ('children' in node) {
        for (const child of (node as ChildrenMixin).children) {
          findComponents(child);
        }
      }
    }

    if (searchAllPages) {
      await figma.loadAllPagesAsync();
      for (const page of figma.root.children) {
        findComponents(page);
      }
    } else {
      findComponents(figma.currentPage);
    }
    return { count: components.length, components };
  },

  get_local_variables: async (p) => {
    const varType = p.type as VariableResolvedDataType | undefined;
    const variables = await figma.variables.getLocalVariablesAsync(varType);
    return {
      count: variables.length,
      variables: variables.map((v) => ({
        id: v.id,
        name: v.name,
        key: v.key,
        resolvedType: v.resolvedType,
        description: v.description,
      })),
    };
  },

  get_variable_collections: async () => {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    return {
      count: collections.length,
      collections: collections.map((c) => ({
        id: c.id,
        name: c.name,
        key: c.key,
        modes: c.modes,
        variableIds: c.variableIds,
      })),
    };
  },

  // ==================== Viewport Commands ====================

  get_viewport: async () => {
    return {
      center: figma.viewport.center,
      zoom: figma.viewport.zoom,
      bounds: figma.viewport.bounds,
    };
  },

  set_viewport: async (p) => {
    if (p.center) {
      figma.viewport.center = p.center as Vector;
    }
    if (p.zoom) {
      figma.viewport.zoom = p.zoom as number;
    }
    return {
      center: figma.viewport.center,
      zoom: figma.viewport.zoom,
    };
  },

  scroll_to_node: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    figma.viewport.scrollAndZoomIntoView([node]);
    return { id: node.id };
  },

  // ==================== Export Commands ====================

  export_node: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    const format = (p.format as 'PNG' | 'JPG' | 'SVG' | 'PDF') || 'PNG';
    const scale = (p.scale as number) || 1;

    let settings: ExportSettings;
    if (format === 'SVG') {
      settings = { format: 'SVG' };
    } else if (format === 'PDF') {
      settings = { format: 'PDF' };
    } else {
      settings = { format, constraint: { type: 'SCALE', value: scale } };
    }

    const bytes = await node.exportAsync(settings);
    const base64 = figma.base64Encode(bytes);
    return { format, base64, size: bytes.length };
  },

  // ==================== Style Commands ====================

  create_paint_style: async (p) => {
    const style = figma.createPaintStyle();
    style.name = p.name as string;
    if (p.color) {
      const c = p.color as { r: number; g: number; b: number; a?: number };
      const opacity = c.a !== undefined ? c.a : 1;
      style.paints = [{ type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: opacity }];
    }
    return { id: style.id, name: style.name, key: style.key };
  },

  create_text_style: async (p) => {
    const style = figma.createTextStyle();
    style.name = p.name as string;
    const fontName: FontName = {
      family: (p.fontFamily as string) || 'Inter',
      style: (p.fontStyle as string) || 'Regular',
    };
    await figma.loadFontAsync(fontName);
    style.fontName = fontName;
    if (p.fontSize) style.fontSize = p.fontSize as number;
    return { id: style.id, name: style.name, key: style.key };
  },

  apply_paint_style: async (p) => {
    const node = await getNode(p.nodeId as string, 'setFillStyleIdAsync');
    const style = await figma.getStyleByIdAsync(p.styleId as string);
    if (!style || style.type !== 'PAINT') throw new Error('Paint style not found');
    await (node as MinimalFillsMixin).setFillStyleIdAsync(style.id);
    return { id: node.id };
  },

  apply_text_style: async (p) => {
    const node = await getTextNode(p.nodeId as string);
    const style = await figma.getStyleByIdAsync(p.styleId as string);
    if (!style || style.type !== 'TEXT') throw new Error('Text style not found');
    await node.setTextStyleIdAsync(style.id);
    return { id: node.id };
  },

  // ==================== Selection Commands ====================

  set_selection: async (p) => {
    const nodes = await getSceneNodes(p.nodeIds as string[]);
    figma.currentPage.selection = nodes;
    return { count: nodes.length };
  },

  // ==================== Notification Commands ====================

  notify: async (p) => {
    const message = p.message as string;
    const options: NotificationOptions = {};
    if (p.timeout) options.timeout = p.timeout as number;
    if (p.error) options.error = p.error as boolean;
    figma.notify(message, options);
    return { notified: true };
  },

  // ==================== Layout Sizing Commands ====================

  set_layout_sizing: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    if (!('layoutSizingHorizontal' in node)) throw new Error('Node does not support layout sizing');
    const layoutNode = node as SceneNode & {
      layoutSizingHorizontal: 'FIXED' | 'HUG' | 'FILL';
      layoutSizingVertical: 'FIXED' | 'HUG' | 'FILL';
    };
    if (p.horizontal) layoutNode.layoutSizingHorizontal = p.horizontal as 'FIXED' | 'HUG' | 'FILL';
    if (p.vertical) layoutNode.layoutSizingVertical = p.vertical as 'FIXED' | 'HUG' | 'FILL';
    return {
      id: node.id,
      layoutSizingHorizontal: layoutNode.layoutSizingHorizontal,
      layoutSizingVertical: layoutNode.layoutSizingVertical,
    };
  },

  set_min_max_size: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    if (!('minWidth' in node)) throw new Error('Node does not support min/max size');
    const sizeNode = node as SceneNode & {
      minWidth: number | null;
      maxWidth: number | null;
      minHeight: number | null;
      maxHeight: number | null;
    };
    if (p.minWidth !== undefined) sizeNode.minWidth = p.minWidth as number | null;
    if (p.maxWidth !== undefined) sizeNode.maxWidth = p.maxWidth as number | null;
    if (p.minHeight !== undefined) sizeNode.minHeight = p.minHeight as number | null;
    if (p.maxHeight !== undefined) sizeNode.maxHeight = p.maxHeight as number | null;
    return {
      id: node.id,
      minWidth: sizeNode.minWidth,
      maxWidth: sizeNode.maxWidth,
      minHeight: sizeNode.minHeight,
      maxHeight: sizeNode.maxHeight,
    };
  },

  set_layout_align: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    if (!('layoutAlign' in node)) throw new Error('Node does not support layout align');
    const layoutNode = node as SceneNode & { layoutAlign: 'INHERIT' | 'STRETCH'; layoutGrow: number };
    if (p.layoutAlign) layoutNode.layoutAlign = p.layoutAlign as 'INHERIT' | 'STRETCH';
    if (p.layoutGrow !== undefined) layoutNode.layoutGrow = p.layoutGrow as number;
    return { id: node.id, layoutAlign: layoutNode.layoutAlign, layoutGrow: layoutNode.layoutGrow };
  },

  set_layout_positioning: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    if (!('layoutPositioning' in node)) throw new Error('Node does not support layout positioning');
    (node as SceneNode & { layoutPositioning: 'AUTO' | 'ABSOLUTE' }).layoutPositioning = p.positioning as
      | 'AUTO'
      | 'ABSOLUTE';
    return { id: node.id, layoutPositioning: p.positioning };
  },

  // ==================== Node Hierarchy Commands ====================

  append_child: async (p) => {
    const parent = await figma.getNodeByIdAsync(p.parentId as string);
    if (!parent || !('appendChild' in parent)) throw new Error('Parent not found or cannot have children');
    const child = await getSceneNode(p.childId as string);
    (parent as ChildrenMixin).appendChild(child);
    return { parentId: parent.id, childId: child.id };
  },

  insert_child: async (p) => {
    const parent = await figma.getNodeByIdAsync(p.parentId as string);
    if (!parent || !('insertChild' in parent)) throw new Error('Parent not found or cannot have children');
    const child = await getSceneNode(p.childId as string);
    (parent as ChildrenMixin).insertChild(p.index as number, child);
    return { parentId: parent.id, childId: child.id, index: p.index };
  },

  reorder_child: async (p) => {
    const parent = await figma.getNodeByIdAsync(p.parentId as string);
    if (!parent || !('insertChild' in parent)) throw new Error('Parent not found or cannot have children');
    const child = await getSceneNode(p.childId as string);
    if (child.parent?.id !== parent.id) throw new Error('Child is not a direct child of parent');
    (parent as ChildrenMixin).insertChild(p.index as number, child);
    return { parentId: parent.id, childId: child.id, index: p.index };
  },

  // ==================== Instance Commands ====================

  detach_instance: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node || node.type !== 'INSTANCE') throw new Error('Node not found or not an instance');
    const detached = (node as InstanceNode).detachInstance();
    return { id: detached.id, name: detached.name, type: detached.type };
  },

  reset_overrides: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node || node.type !== 'INSTANCE') throw new Error('Node not found or not an instance');
    (node as InstanceNode).resetOverrides();
    return { id: node.id, reset: true };
  },

  swap_component: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node || node.type !== 'INSTANCE') throw new Error('Node not found or not an instance');
    const component = await figma.importComponentByKeyAsync(p.componentKey as string);
    (node as InstanceNode).swapComponent(component);
    return { id: node.id, newComponentKey: p.componentKey };
  },

  // ==================== Additional Properties Commands ====================

  set_clips_content: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node || !('clipsContent' in node)) throw new Error('Node not found or does not support clipsContent');
    (node as FrameNode).clipsContent = p.clipsContent as boolean;
    return { id: node.id, clipsContent: p.clipsContent };
  },

  set_layout_wrap: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node || node.type !== 'FRAME') throw new Error('Node not found or not a frame');
    const frame = node as FrameNode;
    frame.layoutWrap = p.wrap as 'NO_WRAP' | 'WRAP';
    if (p.counterAxisSpacing !== undefined) frame.counterAxisSpacing = p.counterAxisSpacing as number;
    if (p.counterAxisAlignContent)
      frame.counterAxisAlignContent = p.counterAxisAlignContent as 'AUTO' | 'SPACE_BETWEEN';
    return { id: node.id, layoutWrap: frame.layoutWrap };
  },

  set_overflow: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node || !('overflowDirection' in node)) throw new Error('Node not found or does not support overflow');
    (node as FrameNode).overflowDirection = p.direction as 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'BOTH';
    return { id: node.id, overflowDirection: p.direction };
  },

  set_guides: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node || !('guides' in node)) throw new Error('Node not found or does not support guides');
    (node as FrameNode | PageNode).guides = p.guides as Guide[];
    return { id: node.id, guidesCount: (p.guides as Guide[]).length };
  },

  // ==================== Table Commands ====================

  create_table: async (p) => {
    const table = figma.createTable(p.numRows as number, p.numColumns as number);
    table.name = (p.name as string) || 'Table';
    if (p.x !== undefined) table.x = p.x as number;
    if (p.y !== undefined) table.y = p.y as number;
    await appendToParent(table, p.parentId as string);
    return { id: table.id, name: table.name, numRows: p.numRows, numColumns: p.numColumns };
  },

  // ==================== Style Commands (Additional) ====================

  create_effect_style: async (p) => {
    const style = figma.createEffectStyle();
    style.name = p.name as string;
    if (p.effects) style.effects = p.effects as Effect[];
    return { id: style.id, name: style.name, key: style.key };
  },

  create_grid_style: async (p) => {
    const style = figma.createGridStyle();
    style.name = p.name as string;
    if (p.layoutGrids) style.layoutGrids = p.layoutGrids as LayoutGrid[];
    return { id: style.id, name: style.name, key: style.key };
  },

  apply_effect_style: async (p) => {
    const node = await getNode(p.nodeId as string, 'effectStyleId');
    const style = await figma.getStyleByIdAsync(p.styleId as string);
    if (!style || style.type !== 'EFFECT') throw new Error('Effect style not found');
    await (node as BlendMixin).setEffectStyleIdAsync(style.id);
    return { id: node.id };
  },

  apply_grid_style: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node || !('gridStyleId' in node)) throw new Error('Node not found or does not support grid style');
    const style = await figma.getStyleByIdAsync(p.styleId as string);
    if (!style || style.type !== 'GRID') throw new Error('Grid style not found');
    await (node as FrameNode).setGridStyleIdAsync(style.id);
    return { id: node.id };
  },

  // ==================== Variable Binding Commands ====================

  set_bound_variable: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    const variable = await figma.variables.getVariableByIdAsync(p.variableId as string);
    if (!variable) throw new Error('Variable not found');
    const field = p.field as VariableBindableNodeField;
    node.setBoundVariable(field, variable);
    return { id: node.id, field, variableId: variable.id };
  },

  // ==================== Component Properties Commands ====================

  get_component_properties: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node || (node.type !== 'INSTANCE' && node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET')) {
      throw new Error('Node not found or not a component/instance');
    }
    if (node.type === 'INSTANCE') {
      return { id: node.id, properties: (node as InstanceNode).componentProperties };
    }
    return {
      id: node.id,
      propertyDefinitions: (node as ComponentNode | ComponentSetNode).componentPropertyDefinitions,
    };
  },

  set_component_properties: async (p) => {
    const node = await figma.getNodeByIdAsync(p.nodeId as string);
    if (!node || node.type !== 'INSTANCE') throw new Error('Node not found or not an instance');
    const instance = node as InstanceNode;
    const properties = p.properties as Record<string, string | boolean>;
    instance.setProperties(properties);
    return { id: node.id, properties };
  },

  // ==================== Export Settings Commands ====================

  set_export_settings: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    if (!('exportSettings' in node)) throw new Error('Node does not support export settings');
    (node as SceneNode & ExportMixin).exportSettings = p.settings as ExportSettings[];
    return { id: node.id, settingsCount: (p.settings as ExportSettings[]).length };
  },

  get_export_settings: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    if (!('exportSettings' in node)) throw new Error('Node does not support export settings');
    return { id: node.id, exportSettings: (node as SceneNode & ExportMixin).exportSettings };
  },

  // ==================== Reactions (Prototype) Commands ====================

  get_reactions: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    if (!('reactions' in node)) throw new Error('Node does not support reactions');
    return { id: node.id, reactions: (node as SceneNode & ReactionMixin).reactions };
  },

  set_reactions: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    if (!('reactions' in node)) throw new Error('Node does not support reactions');
    await (node as SceneNode & ReactionMixin).setReactionsAsync(p.reactions as Reaction[]);
    return { id: node.id, reactionsCount: (p.reactions as Reaction[]).length };
  },

  // ==================== Team Library Commands ====================

  get_library_variable_collections: async () => {
    const collections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
    return {
      count: collections.length,
      collections: collections.map((c) => ({
        key: c.key,
        name: c.name,
        libraryName: c.libraryName,
      })),
    };
  },

  get_library_variables: async (p) => {
    const variables = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(p.collectionKey as string);
    return {
      count: variables.length,
      variables: variables.map((v) => ({
        key: v.key,
        name: v.name,
        resolvedType: v.resolvedType,
      })),
    };
  },

  import_component: async (p) => {
    const component = await figma.importComponentByKeyAsync(p.componentKey as string);
    return {
      id: component.id,
      name: component.name,
      key: component.key,
      description: component.description,
    };
  },

  import_component_set: async (p) => {
    const componentSet = await figma.importComponentSetByKeyAsync(p.componentSetKey as string);
    return {
      id: componentSet.id,
      name: componentSet.name,
      key: componentSet.key,
      description: componentSet.description,
    };
  },

  import_style: async (p) => {
    const style = await figma.importStyleByKeyAsync(p.styleKey as string);
    return {
      id: style.id,
      name: style.name,
      key: style.key,
      type: style.type,
    };
  },

  import_variable: async (p) => {
    const variable = await figma.variables.importVariableByKeyAsync(p.variableKey as string);
    return {
      id: variable.id,
      name: variable.name,
      key: variable.key,
      resolvedType: variable.resolvedType,
    };
  },

  // ==================== Component Set Variants Command ====================

  get_component_set_variants: async (p) => {
    // Import the component set first
    const componentSet = await figma.importComponentSetByKeyAsync(p.componentSetKey as string);

    // Parse variant properties from component name (format: "Prop1=Value1, Prop2=Value2")
    function parseVariantName(name: string): Record<string, string> {
      const props: Record<string, string> = {};
      const pairs = name.split(', ');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
          props[key] = value;
        }
      }
      return props;
    }

    // Get all variants (children of the component set)
    const variants = componentSet.children
      .filter((child): child is ComponentNode => child.type === 'COMPONENT')
      .map((comp) => ({
        id: comp.id,
        name: comp.name,
        key: comp.key,
        variantProperties: parseVariantName(comp.name),
      }));

    return {
      componentSetId: componentSet.id,
      componentSetName: componentSet.name,
      componentSetKey: componentSet.key,
      variantGroupProperties: componentSet.componentPropertyDefinitions,
      count: variants.length,
      variants,
    };
  },

  // ==================== Variable Creation Commands ====================

  create_variable_collection: async (p) => {
    const collection = figma.variables.createVariableCollection(p.name as string);
    return {
      id: collection.id,
      name: collection.name,
      key: collection.key,
      modes: collection.modes,
    };
  },

  create_variable: async (p) => {
    const collection = await figma.variables.getVariableCollectionByIdAsync(p.collectionId as string);
    if (!collection) throw new Error('Variable collection not found');
    const variable = figma.variables.createVariable(
      p.name as string,
      collection,
      p.resolvedType as VariableResolvedDataType,
    );
    return {
      id: variable.id,
      name: variable.name,
      key: variable.key,
      resolvedType: variable.resolvedType,
    };
  },

  set_variable_value: async (p) => {
    const variable = await figma.variables.getVariableByIdAsync(p.variableId as string);
    if (!variable) throw new Error('Variable not found');
    const modeId = p.modeId as string;
    variable.setValueForMode(modeId, p.value as VariableValue);
    return { id: variable.id, modeId, value: p.value };
  },

  create_variable_alias: async (p) => {
    const variable = await figma.variables.getVariableByIdAsync(p.variableId as string);
    if (!variable) throw new Error('Variable not found');
    const alias = figma.variables.createVariableAlias(variable);
    return { type: alias.type, id: alias.id };
  },

  set_bound_variable_for_paint: async (p) => {
    const node = await getNode(p.nodeId as string, 'fills');
    const variable = await figma.variables.getVariableByIdAsync(p.variableId as string);
    if (!variable) throw new Error('Variable not found');
    const fills = (node as GeometryMixin).fills;
    if (!Array.isArray(fills) || fills.length === 0) throw new Error('Node has no fills');
    const fillIndex = (p.fillIndex as number) || 0;
    const fill = fills[fillIndex];
    if (!fill || fill.type !== 'SOLID') throw new Error('Fill at index is not a solid paint');
    const newFills = [...fills];
    newFills[fillIndex] = figma.variables.setBoundVariableForPaint(fill, 'color', variable);
    (node as GeometryMixin).fills = newFills;
    return { id: node.id, fillIndex };
  },

  set_bound_variable_for_effect: async (p) => {
    const node = await getNode(p.nodeId as string, 'effects');
    const variable = await figma.variables.getVariableByIdAsync(p.variableId as string);
    if (!variable) throw new Error('Variable not found');
    const effects = (node as BlendMixin).effects;
    if (!Array.isArray(effects) || effects.length === 0) throw new Error('Node has no effects');
    const effectIndex = (p.effectIndex as number) || 0;
    const effect = effects[effectIndex];
    if (!effect) throw new Error('Effect at index not found');
    const field = p.field as VariableBindableEffectField;
    const newEffects = [...effects];
    newEffects[effectIndex] = figma.variables.setBoundVariableForEffect(effect, field, variable);
    (node as BlendMixin).effects = newEffects;
    return { id: node.id, effectIndex, field };
  },

  set_bound_variable_for_layout_grid: async (p) => {
    const node = await getNode(p.nodeId as string, 'layoutGrids');
    const variable = await figma.variables.getVariableByIdAsync(p.variableId as string);
    if (!variable) throw new Error('Variable not found');
    const grids = (node as FrameNode).layoutGrids;
    if (!Array.isArray(grids) || grids.length === 0) throw new Error('Node has no layout grids');
    const gridIndex = (p.gridIndex as number) || 0;
    const grid = grids[gridIndex];
    if (!grid) throw new Error('Grid at index not found');
    const field = p.field as VariableBindableLayoutGridField;
    const newGrids = [...grids];
    newGrids[gridIndex] = figma.variables.setBoundVariableForLayoutGrid(grid, field, variable);
    (node as FrameNode).layoutGrids = newGrids;
    return { id: node.id, gridIndex, field };
  },

  // ==================== Team Library Commands ====================

  import_style_by_key: async (p) => {
    const key = p.key as string;
    const style = await figma.importStyleByKeyAsync(key);
    return { id: style.id, name: style.name, type: style.type, key: style.key };
  },

  import_variable_by_key: async (p) => {
    const key = p.key as string;
    const variable = await figma.variables.importVariableByKeyAsync(key);
    return {
      id: variable.id,
      name: variable.name,
      key: variable.key,
      resolvedType: variable.resolvedType,
      scopes: variable.scopes,
    };
  },

  // ==================== Combine As Variants Command ====================

  combine_as_variants: async (p) => {
    const nodeIds = p.nodeIds as string[];
    const nodes: ComponentNode[] = [];
    for (const id of nodeIds) {
      const node = await figma.getNodeByIdAsync(id);
      if (!node || node.type !== 'COMPONENT') throw new Error(`Node not found or not a component: ${id}`);
      nodes.push(node as ComponentNode);
    }
    if (nodes.length < 2) throw new Error('Need at least 2 components to combine as variants');
    const componentSet = figma.combineAsVariants(nodes, getNodesParent(nodes));
    return { id: componentSet.id, name: componentSet.name, key: componentSet.key };
  },

  // ==================== Image Commands ====================

  get_image_by_hash: async (p) => {
    const image = figma.getImageByHash(p.hash as string);
    if (!image) throw new Error('Image not found');
    const size = await image.getSizeAsync();
    return { hash: image.hash, width: size.width, height: size.height };
  },

  get_image_bytes: async (p) => {
    const image = figma.getImageByHash(p.hash as string);
    if (!image) throw new Error('Image not found');
    const bytes = await image.getBytesAsync();
    const base64 = figma.base64Encode(bytes);
    return { hash: image.hash, base64, size: bytes.length };
  },

  create_image_from_url: async (p) => {
    const image = await figma.createImageAsync(p.url as string);
    const size = await image.getSizeAsync();
    // Create a rectangle with the image as fill
    const rect = figma.createRectangle();
    rect.name = (p.name as string) || 'Image';
    rect.x = (p.x as number) || 0;
    rect.y = (p.y as number) || 0;
    rect.resize((p.width as number) || size.width, (p.height as number) || size.height);
    rect.fills = [
      { type: 'IMAGE', imageHash: image.hash, scaleMode: (p.scaleMode as 'FILL' | 'FIT' | 'CROP' | 'TILE') || 'FILL' },
    ];
    await appendToParent(rect, p.parentId as string);
    return { id: rect.id, name: rect.name, imageHash: image.hash, width: size.width, height: size.height };
  },

  // ==================== Node Tree Command ====================

  create_node_tree: async (p) => {
    const tree = p.tree as NodeTreeDef;
    if (!tree || !tree.type) throw new Error('Invalid tree definition');

    // Create root node and all children recursively
    const rootNode = await createNodeFromDef(tree);

    // Append to parent if specified
    if (p.parentId) {
      const parent = await figma.getNodeByIdAsync(p.parentId as string);
      if (parent && 'appendChild' in parent) {
        (parent as ChildrenMixin).appendChild(rootNode);
      }
    }

    // Return the created tree with all node IDs
    return serializeCreatedTree(rootNode);
  },

  // ==================== Font Commands ====================

  list_available_fonts: async () => {
    const fonts = await figma.listAvailableFontsAsync();
    return {
      count: fonts.length,
      fonts: fonts.map((f) => ({
        family: f.fontName.family,
        style: f.fontName.style,
      })),
    };
  },

  // ==================== Text Paragraph Commands ====================

  set_paragraph_indent: async (p) => {
    const node = await getTextNode(p.nodeId as string);
    await loadTextFont(node);
    node.paragraphIndent = p.paragraphIndent as number;
    return { id: node.id, paragraphIndent: node.paragraphIndent };
  },

  set_paragraph_spacing: async (p) => {
    const node = await getTextNode(p.nodeId as string);
    await loadTextFont(node);
    node.paragraphSpacing = p.paragraphSpacing as number;
    return { id: node.id, paragraphSpacing: node.paragraphSpacing };
  },

  // ==================== Utility Commands ====================

  parse_color: async (p) => {
    const color = p.color as string;
    const rgb = figma.util.rgb(color);
    return { r: rgb.r, g: rgb.g, b: rgb.b };
  },

  parse_color_rgba: async (p) => {
    const color = p.color as string;
    const rgba = figma.util.rgba(color);
    return { r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a };
  },

  create_solid_paint: async (p) => {
    const color = p.color as string;
    const overrides = p.overrides as Partial<SolidPaint> | undefined;
    const paint = figma.util.solidPaint(color, overrides);
    return paint;
  },

  // ==================== Selection Colors Command ====================

  get_selection_colors: async () => {
    const colors = figma.getSelectionColors();
    if (!colors) return { paints: [], styles: [] };
    return {
      paints: colors.paints || [],
      styles: colors.styles || [],
    };
  },

  // ==================== Style Ordering Commands ====================

  move_paint_style_after: async (p) =>
    moveStyleAfter<PaintStyle>(
      p.targetStyleId as string,
      p.referenceStyleId as string,
      'PAINT',
      figma.moveLocalPaintStyleAfter,
    ),

  move_text_style_after: async (p) =>
    moveStyleAfter<TextStyle>(
      p.targetStyleId as string,
      p.referenceStyleId as string,
      'TEXT',
      figma.moveLocalTextStyleAfter,
    ),

  move_effect_style_after: async (p) =>
    moveStyleAfter<EffectStyle>(
      p.targetStyleId as string,
      p.referenceStyleId as string,
      'EFFECT',
      figma.moveLocalEffectStyleAfter,
    ),

  move_grid_style_after: async (p) =>
    moveStyleAfter<GridStyle>(
      p.targetStyleId as string,
      p.referenceStyleId as string,
      'GRID',
      figma.moveLocalGridStyleAfter,
    ),

  // ==================== Event Subscription Commands ====================

  subscribe_event: async (p) => {
    const eventType = p.eventType as keyof typeof eventSubscriptions;
    if (!(eventType in eventSubscriptions)) {
      throw new Error(`Invalid event type: ${eventType}`);
    }
    eventSubscriptions[eventType] = true;
    return { subscribed: true, eventType };
  },

  unsubscribe_event: async (p) => {
    const eventType = p.eventType as keyof typeof eventSubscriptions;
    if (!(eventType in eventSubscriptions)) {
      throw new Error(`Invalid event type: ${eventType}`);
    }
    eventSubscriptions[eventType] = false;
    return { unsubscribed: true, eventType };
  },

  get_event_subscriptions: async () => {
    return { subscriptions: eventSubscriptions };
  },
};

// ========== Command Processing ==========

async function handleCommand(cmd: CommandMessage) {
  const { id, command, params } = cmd;
  const handler = commandHandlers[command];

  if (!handler) {
    sendResponse(id, false, null, `Unknown command: ${command}`);
    return;
  }

  try {
    const result = await handler(params);
    sendResponse(id, true, result);
  } catch (err) {
    console.error(`Command failed: ${command}`, err);
    sendResponse(id, false, null, (err as Error).message);
  }
}

function sendResponse(id: string, success: boolean, result: unknown, error?: string) {
  figma.ui.postMessage({
    type: 'command-response',
    response: { id, success, result, error },
  });
}

// ========== Initialization ==========

figma.showUI(__html__, { width: 280, height: 330 });

figma.ui.postMessage({
  type: 'file-info',
  fileKey: figma.fileKey,
  fileName: figma.root.name,
  channel: FILE_CHANNEL,
});

figma.on('selectionchange', () => {
  const nodes = figma.currentPage.selection.map((node) => ({
    id: node.id,
    name: node.name,
    type: node.type,
  }));
  figma.ui.postMessage({ type: 'selection', nodes });

  // Send event if subscribed
  if (eventSubscriptions.selectionchange) {
    figma.ui.postMessage({
      type: 'event',
      eventType: 'selectionchange',
      data: { nodes },
    });
  }
});

figma.on('currentpagechange', () => {
  if (eventSubscriptions.currentpagechange) {
    const page = figma.currentPage;
    figma.ui.postMessage({
      type: 'event',
      eventType: 'currentpagechange',
      data: {
        id: page.id,
        name: page.name,
      },
    });
  }
});

figma.on('stylechange', (event) => {
  if (eventSubscriptions.stylechange) {
    figma.ui.postMessage({
      type: 'event',
      eventType: 'stylechange',
      data: {
        changes: event.styleChanges.map((change) => ({
          type: change.type,
          id: change.id,
        })),
      },
    });
  }
});

// documentchange requires loadAllPagesAsync first
(async () => {
  await figma.loadAllPagesAsync();
  figma.on('documentchange', (event) => {
    if (eventSubscriptions.documentchange) {
      figma.ui.postMessage({
        type: 'event',
        eventType: 'documentchange',
        data: {
          changes: event.documentChanges.map((change) => {
            const result: { type: string; id: string; properties?: string[] } = {
              type: change.type,
              id: change.id,
            };
            if (change.type === 'PROPERTY_CHANGE') {
              result.properties = (change as PropertyChange).properties;
            }
            return result;
          }),
        },
      });
    }
  });
})();

figma.ui.onmessage = async (msg: { type: string; message?: string; data?: CommandMessage }) => {
  switch (msg.type) {
    case 'command':
      if (msg.data) {
        await handleCommand(msg.data);
      }
      break;
    case 'notify':
      if (msg.message) {
        figma.notify(msg.message);
      }
      break;
  }
};
