import Link from "next/link";

// Marca aplicației. Codul „A" în mono → registru oficial.
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="Autopilot acte cetățean">
      <span className="brand__mark" aria-hidden="true">
        A
      </span>
      Autopilot&nbsp;acte
    </Link>
  );
}
