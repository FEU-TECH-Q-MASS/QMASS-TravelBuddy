import {
  FiArrowRight,
  FiChevronRight,
  FiMapPin,
  FiCalendar,
  FiCreditCard,
  FiStar,
  FiCompass,
  FiMap,
  FiSun,
  FiUsers,
  FiCheck,
  FiClock,
  FiMail,
  FiGlobe,
  FiEye,
  FiEyeOff,
  FiX,
  FiMenu,
  FiFeather,
  FiPlus,
  FiMinus,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";

const icons = {
  arrow: FiArrowRight,
  chevron: FiChevronRight,
  pin: FiMapPin,
  calendar: FiCalendar,
  wallet: FiCreditCard,
  spark: FiStar,
  compass: FiCompass,
  route: FiMap,
  sun: FiSun,
  users: FiUsers,
  check: FiCheck,
  clock: FiClock,
  mail: FiMail,
  globe: FiGlobe,
  eye: FiEye,
  eyeOff: FiEyeOff,
  close: FiX,
  menu: FiMenu,
  leaf: FiFeather,
  plus: FiPlus,
  minus: FiMinus,
  edit: FiEdit2,
  trash: FiTrash2,
};

// Keep all interface icons consistent through the React Icons Feather set.
export default function Icon({ name = "arrow", size = 20, className = "" }) {
  const Component = icons[name] || FiArrowRight;
  return (
    <Component
      size={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    />
  );
}
