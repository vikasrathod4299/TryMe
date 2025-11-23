
import { useRouter } from "../router/RouterProvider";

export default function Link({
  to,
  children,
  className,
  activeClassName,
  inactiveClassName,
}: any) {
  const { currentPath, navigate } = useRouter();
  const active = currentPath === to;

  return (
    <button
      onClick={() => navigate(to)}
      className={`${className} ${active ? activeClassName : inactiveClassName}`}
    >
      {children}
    </button>
  );
}
