import Link from "next/link";

const footerLinks = {
  navigation: [
    { href: "/", label: "Hub" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/events", label: "Events" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ],
  connect: [
    { href: "https://linkedin.com/in/ankitsingh", label: "LinkedIn", external: true },
    { href: "mailto:ankit.singh101@gmail.com", label: "Email", external: true },
  ],
  legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-surface-container-low w-full py-12 px-6 md:px-8 mt-20">
      <div className="max-w-7xl mx-auto">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-outline-variant/15">
          {/* Branding */}
          <div className="md:col-span-1">
            <div className="font-[family-name:var(--font-headline)] font-bold text-on-surface text-lg">
              Ankit Singh
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-label-md text-on-surface-variant mb-4">Navigation</h4>
            <div className="flex flex-col gap-3">
              {footerLinks.navigation.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-body-md text-on-surface-variant hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-label-md text-on-surface-variant mb-4">Connect</h4>
            <div className="flex flex-col gap-3">
              {footerLinks.connect.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="text-body-md text-on-surface-variant hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-label-md text-on-surface-variant mb-4">Legal</h4>
            <div className="flex flex-col gap-3">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-body-md text-on-surface-variant hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-body-md text-on-surface-variant/60">
            © {new Date().getFullYear()} Ankit Singh.
          </p>
          <p className="text-body-md text-on-surface-variant/40">
            Built with Precision.
          </p>
        </div>
      </div>
    </footer>
  );
}
