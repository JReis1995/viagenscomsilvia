import { redirect } from "next/navigation";

import { ContaHeader } from "@/components/conta/conta-header";
import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { createClient } from "@/lib/supabase/server";

export default async function ContaAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/conta");
  }

  if (await isConsultoraEmailAsync(user.email, supabase)) {
    redirect("/crm");
  }

  return (
    <>
      <ContaHeader email={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 md:py-10">
        {children}
      </main>
    </>
  );
}
