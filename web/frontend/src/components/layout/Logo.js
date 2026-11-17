import Image from "next/image";
import Link from "next/link";
export default function Logo({ onClick }) {
  return (
    <Link href="/" aria-label="TravelBuddy home" className="brand-logo" onClick={onClick}>
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
