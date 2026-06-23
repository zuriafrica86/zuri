import { logout } from "@/app/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-xl2 border border-sable px-4 py-2 text-sm font-medium text-cacao/70 transition hover:bg-rose/30"
      >
        Se déconnecter
      </button>
    </form>
  );
}
