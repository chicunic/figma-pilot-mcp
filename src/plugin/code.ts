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

// ========== Constants ==========

function sanitizeChannelName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w-]/g, '-')  // Replace non-word chars (except -) with -
    .replace(/-+/g, '-')       // Collapse multiple dashes
    .replace(/^-|-$/g, '');    // Trim leading/trailing dashes
}

const FILE_CHANNEL = 'figma-pilot-' + (figma.fileKey || sanitizeChannelName(figma.root.name) || 'local');

// ========== Helper Functions ==========

async function appendToParent(node: SceneNode, parentId?: string) {
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
    throw new Error('Node not found or missing property: ' + requiredProp);
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

async function getTextNode(nodeId: string): Promise<TextNode> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || node.type !== 'TEXT') throw new Error('Node not found or not a text node');
  return node as TextNode;
}

async function loadTextFont(node: TextNode) {
  const fontName = node.fontName;
  if (fontName === figma.mixed) throw new Error('Mixed fonts not supported');
  await figma.loadFontAsync(fontName);
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
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(nodeName);
  }
  return nodeName === pattern;
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
    const nodeIds = p.nodeIds as string[];
    const nodes: SceneNode[] = [];
    for (const id of nodeIds) {
      const node = await getSceneNode(id);
      nodes.push(node);
    }
    if (nodes.length === 0) throw new Error('No nodes to group');
    const parent = nodes[0]!.parent;
    if (!parent || !('children' in parent)) throw new Error('Cannot group nodes without parent');
    const group = figma.group(nodes, parent as ChildrenMixin & BaseNode);
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
    const nodeIds = p.nodeIds as string[];
    const nodes: SceneNode[] = [];
    for (const id of nodeIds) {
      const node = await getSceneNode(id);
      nodes.push(node);
    }
    if (nodes.length === 0) throw new Error('No nodes to flatten');
    const parent = nodes[0]!.parent;
    if (!parent || !('children' in parent)) throw new Error('Cannot flatten nodes without parent');
    const flattened = figma.flatten(nodes, parent as ChildrenMixin & BaseNode);
    return { id: flattened.id, name: flattened.name };
  },

  // ==================== Boolean Operations ====================

  boolean_union: async (p) => {
    const nodeIds = p.nodeIds as string[];
    const nodes: SceneNode[] = [];
    for (const id of nodeIds) {
      const node = await getSceneNode(id);
      nodes.push(node);
    }
    if (nodes.length < 2) throw new Error('Need at least 2 nodes for boolean operation');
    const parent = nodes[0]!.parent;
    if (!parent || !('children' in parent)) throw new Error('Cannot perform boolean without parent');
    const result = figma.union(nodes, parent as ChildrenMixin & BaseNode);
    return { id: result.id, name: result.name };
  },

  boolean_subtract: async (p) => {
    const nodeIds = p.nodeIds as string[];
    const nodes: SceneNode[] = [];
    for (const id of nodeIds) {
      const node = await getSceneNode(id);
      nodes.push(node);
    }
    if (nodes.length < 2) throw new Error('Need at least 2 nodes for boolean operation');
    const parent = nodes[0]!.parent;
    if (!parent || !('children' in parent)) throw new Error('Cannot perform boolean without parent');
    const result = figma.subtract(nodes, parent as ChildrenMixin & BaseNode);
    return { id: result.id, name: result.name };
  },

  boolean_intersect: async (p) => {
    const nodeIds = p.nodeIds as string[];
    const nodes: SceneNode[] = [];
    for (const id of nodeIds) {
      const node = await getSceneNode(id);
      nodes.push(node);
    }
    if (nodes.length < 2) throw new Error('Need at least 2 nodes for boolean operation');
    const parent = nodes[0]!.parent;
    if (!parent || !('children' in parent)) throw new Error('Cannot perform boolean without parent');
    const result = figma.intersect(nodes, parent as ChildrenMixin & BaseNode);
    return { id: result.id, name: result.name };
  },

  boolean_exclude: async (p) => {
    const nodeIds = p.nodeIds as string[];
    const nodes: SceneNode[] = [];
    for (const id of nodeIds) {
      const node = await getSceneNode(id);
      nodes.push(node);
    }
    if (nodes.length < 2) throw new Error('Need at least 2 nodes for boolean operation');
    const parent = nodes[0]!.parent;
    if (!parent || !('children' in parent)) throw new Error('Cannot perform boolean without parent');
    const result = figma.exclude(nodes, parent as ChildrenMixin & BaseNode);
    return { id: result.id, name: result.name };
  },

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
    node.fills = [
      { type: 'SOLID', color: { r: p.r as number, g: p.g as number, b: p.b as number }, opacity: opacity },
    ];
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
            currentDepth + 1
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

  get_local_components: async () => {
    const components: Array<{ id: string; name: string; key: string; description: string }> = [];

    function findComponents(node: BaseNode) {
      if (node.type === 'COMPONENT') {
        const comp = node as ComponentNode;
        components.push({ id: comp.id, name: comp.name, key: comp.key, description: comp.description });
      }
      if ('children' in node) {
        for (const child of (node as ChildrenMixin).children) {
          findComponents(child);
        }
      }
    }

    findComponents(figma.currentPage);
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
    const nodeIds = p.nodeIds as string[];
    const nodes: SceneNode[] = [];
    for (const id of nodeIds) {
      const node = await getSceneNode(id);
      nodes.push(node);
    }
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
    const layoutNode = node as SceneNode & { layoutSizingHorizontal: 'FIXED' | 'HUG' | 'FILL'; layoutSizingVertical: 'FIXED' | 'HUG' | 'FILL' };
    if (p.horizontal) layoutNode.layoutSizingHorizontal = p.horizontal as 'FIXED' | 'HUG' | 'FILL';
    if (p.vertical) layoutNode.layoutSizingVertical = p.vertical as 'FIXED' | 'HUG' | 'FILL';
    return { id: node.id, layoutSizingHorizontal: layoutNode.layoutSizingHorizontal, layoutSizingVertical: layoutNode.layoutSizingVertical };
  },

  set_min_max_size: async (p) => {
    const node = await getSceneNode(p.nodeId as string);
    if (!('minWidth' in node)) throw new Error('Node does not support min/max size');
    const sizeNode = node as SceneNode & { minWidth: number | null; maxWidth: number | null; minHeight: number | null; maxHeight: number | null };
    if (p.minWidth !== undefined) sizeNode.minWidth = p.minWidth as number | null;
    if (p.maxWidth !== undefined) sizeNode.maxWidth = p.maxWidth as number | null;
    if (p.minHeight !== undefined) sizeNode.minHeight = p.minHeight as number | null;
    if (p.maxHeight !== undefined) sizeNode.maxHeight = p.maxHeight as number | null;
    return { id: node.id, minWidth: sizeNode.minWidth, maxWidth: sizeNode.maxWidth, minHeight: sizeNode.minHeight, maxHeight: sizeNode.maxHeight };
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
    (node as SceneNode & { layoutPositioning: 'AUTO' | 'ABSOLUTE' }).layoutPositioning = p.positioning as 'AUTO' | 'ABSOLUTE';
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
    if (p.counterAxisAlignContent) frame.counterAxisAlignContent = p.counterAxisAlignContent as 'AUTO' | 'SPACE_BETWEEN';
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
    return { id: node.id, propertyDefinitions: (node as ComponentNode | ComponentSetNode).componentPropertyDefinitions };
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
};

// ========== Command Processing ==========

async function handleCommand(cmd: CommandMessage) {
  const { id, command, params } = cmd;
  const handler = commandHandlers[command];

  if (!handler) {
    sendResponse(id, false, null, 'Unknown command: ' + command);
    return;
  }

  try {
    const result = await handler(params);
    sendResponse(id, true, result);
  } catch (err) {
    console.error('Command failed: ' + command, err);
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
});

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
