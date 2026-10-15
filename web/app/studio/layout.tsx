// The Studio's own root layout: the site's layout (fonts, global CSS, header,
// smooth scrolling) stays out of it, and the Studio brings its own styles.
export default function StudioLayout({ children }: LayoutProps<"/studio">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
