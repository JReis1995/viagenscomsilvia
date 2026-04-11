import { redirect } from "next/navigation";

import { CrmHeader } from "@/components/crm/crm-header";
import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { createClient } from "@/lib/supabase/server";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/crm");
  }

  if (!(await isConsultoraEmailAsync(user.email, supabase))) {
    redirect("/conta?crm=forbidden");
  }

  return (
    <div className="flex min-h-full flex-col bg-sand">
      <CrmHeader email={user.email} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
