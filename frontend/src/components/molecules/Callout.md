# Callout Component

A versatile badge-like molecule component for highlighting information throughout your application.

## Features

- **Multiple Variants**: `default`, `secondary`, `destructive`, `outline`, `info`, `warning`, `success`
- **Flexible Sizing**: `sm`, `md`, `lg` 
- **Feather Icons**: Supports all Feather icons via `react-icons/fi`
- **Custom Icons**: Can accept any React node as an icon
- **Responsive**: Works well in banners, pages, and other components

## Usage

### Basic Usage

```tsx
import Callout from '../molecules/Callout';

<Callout icon="FiInfo" variant="info">
  This is an information callout
</Callout>
```

### Available Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | The content to display |
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline' \| 'info' \| 'warning' \| 'success'` | `'default'` | The visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | The size of the callout |
| `icon` | `keyof typeof Icons \| React.ReactNode` | - | Feather icon name or custom icon |
| `className` | `string` | - | Additional CSS classes |

### Available Feather Icons

Use any Feather icon by its name from `react-icons/fi`. Common examples:

- `FiInfo` - Information icon
- `FiAlertTriangle` - Warning icon
- `FiCheckCircle` - Success icon
- `FiXCircle` - Error icon
- `FiStar` - Star icon
- `FiHeart` - Heart icon
- `FiZap` - Lightning icon
- `FiClock` - Clock icon

### Examples

#### In a Banner
```tsx
<Banner>
  <div className="flex items-center gap-3">
    <span>New feature available!</span>
    <Callout icon="FiZap" variant="info" size="sm">
      Beta
    </Callout>
  </div>
</Banner>
```

#### Status Indicators
```tsx
<Callout icon="FiCheckCircle" variant="success" size="sm">
  Live
</Callout>

<Callout icon="FiClock" variant="warning" size="sm">
  Pending
</Callout>
```

#### Custom Icons
```tsx
<Callout icon={<CustomSvgIcon />} variant="outline">
  Custom icon
</Callout>

<Callout variant="default">
  No icon
</Callout>
```

## Styling

The component uses Tailwind CSS classes and follows your existing color scheme:

- **Primary colors**: Uses your custom primary colors defined in `tailwind.config.js`
- **Semantic colors**: Consistent with your SCSS color variables
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Includes proper focus states and transitions

## Integration

The Callout component is designed to work seamlessly with:

- **Banner component**: Perfect for status indicators and badges
- **Page content**: Inline information highlights
- **Forms**: Field status indicators
- **Lists**: Item status badges
- **Cards**: Corner badges and status indicators