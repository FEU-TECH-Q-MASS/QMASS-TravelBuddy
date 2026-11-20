import Image from "next/image";
import Link from "next/link";
export default function Logo({ href, onClick }) {
  return (
    <Link href={href} aria-label="TravelBuddy Home" className="brand-logo" onClick={onClick}>
      <Image
        src="/images/TravelBuddy.png"
        alt=""
        width={1920}
        height={1080}
        priority
      />
    </Link>
  );
}
