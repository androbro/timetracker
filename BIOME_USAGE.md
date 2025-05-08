# Biome Usage Guide

This project uses [Biome](https://biomejs.dev/) for code formatting and linting. This document explains how to work with Biome, particularly for the automated sorting of CSS classes.

## CSS Class Sorting

Biome is configured to automatically sort CSS classes in your code using the `useSortedClasses` rule. This helps maintain consistent class ordering throughout the codebase.

### Tailwind CSS Class Organization

When using Tailwind CSS, classes are sorted alphabetically by default. This can make it difficult to understand the structure of your styles. The Biome configuration sorts classes in a logical order:

1. Layout classes (display, position, etc.)
2. Size/Dimension classes (width, height, etc.)
3. Spacing classes (margin, padding, etc.)
4. Typography classes (font, text, etc.)
5. Visual classes (colors, backgrounds, etc.)
6. Interactive classes (hover, focus, etc.)

This ordering happens automatically when you format your code with Biome.

### Fixing Class Sorting Issues

If you encounter Biome linting warnings like:

```
These CSS classes should be sorted. biomelint/nursery/useSortedClasses
```

You can fix these issues in several ways:

#### 1. Using VS Code (Recommended)

The project includes VS Code settings that enable automatic formatting and fixing on save:

- Install the [Biome VS Code Extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- When you save a file, Biome will automatically fix class sorting issues

#### 2. Using npm scripts

Run one of these commands in your terminal:

- Fix all issues including class sorting (with unsafe fixes):
  ```
  npm run fix:classes
  ```

- Fix standard issues (may not fix all class sorting issues):
  ```
  npm run check:write
  ```

#### 3. Manual command

Run Biome directly:

```
npx biome check --write --unsafe .
```

## Other Biome Commands

- Check code without modifying:
  ```
  npm run check
  ```

- Format and fix all issues (including potentially unsafe ones):
  ```
  npm run check:unsafe
  ```

## Configuration

Biome is configured in the `biome.jsonc` file at the root of the project. The configuration includes:

- Enabled formatter and linter
- Organized imports
- CSS class sorting using the `cn`, `clsx`, and `cva` utilities 

## Troubleshooting

If class sorting isn't working:

1. Make sure you're using one of the configured utility functions (`cn`, `clsx`, or `cva`) for your class names
2. If using custom class name utilities, you may need to add them to the `functions` list in `biome.jsonc`
3. Try running the fix command with VSCode to see the auto-formatting in action
4. Ensure you have the Biome extension installed and enabled in VSCode 