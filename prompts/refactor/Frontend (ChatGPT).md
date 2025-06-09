# Frontend Refactor Prompt

> Refactor the entire `src/` folder of a React.js project using Tailwind CSS for modern best practices, code readability, and consistent UI/UX. This includes all components, layouts, hooks, state logic, utility files, and style integrations.
>
> ✅ Goals:
> – Convert large or deeply nested components into smaller, reusable components
> – Organize the project with a clear folder structure: `components/`, `layouts/`, `hooks/`, `pages/`, `utils/`, and `lib/`
> – Clean up unused components, props, and legacy code
> – Normalize Tailwind usage: remove inline styles or redundant utility classes, apply consistent spacing and typography
> – Use meaningful names for components and files
> – Adopt functional, idiomatic React patterns (e.g., hooks over classes, state lifting where needed)
> – Extract logic-heavy concerns into custom hooks or helper functions
>
> ✅ Tailwind Guidelines:
> – Use semantic Tailwind classes and design tokens instead of hardcoded pixel values
> – Apply consistent spacing, color palette, and responsive breakpoints
> – Use `@apply` only inside Tailwind config files or component-level CSS modules when appropriate
>
> ✅ Bonus if you can:
> – Migrate inline JSX logic into clean helper functions
> – Add loading, empty, and error UI states for key pages or components
> – Introduce global state management (e.g. Zustand, Redux, or Context) if needed
> – Add animation transitions using `@tailwindcss/animate` or Framer Motion
> – Include responsive design adjustments for mobile and tablet views
> – Auto-generate placeholder assets or skeletons for dynamic content
>
> The goal is to make the `src/` folder feel like a production-ready, well-structured React app with consistent Tailwind styling and component design.
