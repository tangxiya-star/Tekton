# 标注系统实施方案

## 需求
- 点击3D模型的某个部件 → 显示侧边标注框
- 标注框包含：中文名、英文名、说明、来源参考图
- 用线（leader line）指向被点击部件
- 支持关闭标注

---

## 实施步骤

### 1️⃣ 为关键部件添加标注数据
**文件**: `artifacts/structural-spec.json` → 扩展 `components[].annotation` 字段

```json
{
  "id": "pz-2-center-zhuzhu",
  "name_zh": "pz-2中央支撑柱",
  "name_en": "Central support post",
  "annotation": {
    "title_zh": "中央支撑柱",
    "title_en": "Central Support Post",
    "desc_zh": "竖向贯穿各层斗拱，将荷载集中于柱头。参考图中最显著的特征。",
    "desc_en": "Vertical post threading through bracket layers. Key feature from reference detail analysis.",
    "reference_image": "references/details/dougong-bracket-detail.jpg",
    "reference_label": "斗拱细部图"
  },
  ...
}
```

### 2️⃣ 创建 Annotation UI 组件
**新文件**: `components/AnnotationPanel.tsx`

功能：
- 显示选中部件的标注信息
- 展示参考图片（缩略图）
- 包含关闭按钮
- 可拖动位置

```tsx
export function AnnotationPanel({
  component,
  screenPos,
  onClose,
}: {
  component: Component & { annotation?: AnnotationData };
  screenPos: { x: number; y: number };
  onClose: () => void;
}) {
  return (
    <div className="annotation-panel" style={{ left: screenPos.x, top: screenPos.y }}>
      <div className="panel-title">{component.annotation?.title_zh}</div>
      <div className="panel-title-en">{component.annotation?.title_en}</div>
      <div className="panel-desc">{component.annotation?.desc_zh}</div>
      {component.annotation?.reference_image && (
        <div className="reference-section">
          <img src={component.annotation.reference_image} alt="reference" />
          <p>{component.annotation.reference_label}</p>
        </div>
      )}
      <button onClick={onClose}>×</button>
    </div>
  );
}
```

### 3️⃣ 修改 Viewer.tsx
**改动**:

1. 添加 Raycaster（用于点击检测）
2. 跟踪选中的部件
3. 计算屏幕坐标
4. 渲染 AnnotationPanel
5. 绘制 leader line（可选：用 THREE.Line）

```tsx
// 在 Viewer 中添加：
const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
const [annotationPos, setAnnotationPos] = useState({ x: 0, y: 0 });

// 点击处理
const handleCanvasClick = (event: THREE.Intersection[]) => {
  if (event.length === 0) {
    setSelectedComponent(null);
    return;
  }

  // 获取被点击的部件 ID
  const hit = event[0];
  const componentId = hit.object.userData.componentId;
  const component = spec.components.find(c => c.id === componentId);
  
  if (component && 'annotation' in component) {
    setSelectedComponent(component);
    // 转换世界坐标到屏幕坐标
    const screenPos = worldToScreen(hit.point, camera);
    setAnnotationPos(screenPos);
  }
};
```

### 4️⃣ Leader Line（可选增强）
在标注框和部件间绘制连线：

```tsx
// 使用 THREE.Line 或 SVG 线条
// 从屏幕坐标 annotationPos 到被点击部件的屏幕坐标
```

---

## 优先级实施

### Phase 1（已完成 ✅）
- [x] 为斗拱部件添加 `annotation` 字段 — 64个部件添加了annotation数据
- [x] 创建 AnnotationPanel 组件 — components/AnnotationPanel.tsx 完成
- [x] 在 Viewer 中添加 Raycaster 和点击处理 — ClickHandler.tsx + Viewer.tsx 集成
- [x] 显示标注面板 — Viewer.tsx中完整实现
- [x] 导入样式表 — annotation.css 已在 app/layout.tsx 中导入

### Phase 2（可选）
- [ ] 绘制 leader line
- [ ] 支持拖动标注框位置
- [ ] 标注面板动画（淡入/淡出）
- [ ] 参考图的放大预览

### Phase 3（增强）
- [ ] 标注间的导航（prev/next）
- [ ] 按分类筛选标注
- [ ] 标注数据的编辑界面

---

## 文件改动清单

| 文件 | 改动 |
|------|------|
| `artifacts/structural-spec.json` | 添加 `annotation` 字段（特定部件） |
| `components/Viewer.tsx` | 添加 Raycaster、点击处理、状态管理 |
| `components/AnnotationPanel.tsx` | 新建，显示标注信息 |
| `styles/annotation.css` | 新建，标注面板样式 |

---

---

## ✅ 实现完成

### 已实现的功能
1. **点击检测** — ClickHandler.tsx通过Raycaster实现3D模型点击
   - 归一化鼠标坐标
   - 遍历场景所有Mesh对象
   - 转换世界坐标到屏幕坐标
   - 触发onComponentClick回调

2. **状态管理** — Viewer.tsx中管理标注UI状态
   - selectedComponent：存储被选中部件信息（含annotation字段）
   - annotationPos：存储标注框屏幕位置

3. **标注面板** — AnnotationPanel.tsx完整的UI组件
   - 显示中英文标题、说明文本
   - 参考图片的可折叠显示
   - Leader line (虚线)指向被点击部件
   - 点击X或遮罩关闭面板

4. **样式支持** — annotation.css
   - 面板动画（slideIn）
   - 响应式设计（768px/480px断点）
   - leader line虚线样式

### 下一步（可选增强）
- [ ] 在leader line上添加动画效果
- [ ] 标注面板的拖动功能
- [ ] 标注数据的在线编辑界面
- [ ] 按分类筛选标注显示
