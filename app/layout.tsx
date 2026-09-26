import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Onest } from "next/font/google"
import { LangProvider } from "@/components/lang"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DEFAULT_LANG, LANG_COOKIE, isLang } from "@/lib/i18n"
import "./globals.css"

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
})

export const metadata: Metadata = {
  title: "Choose AI",
  description:
    "Paste a prompt — Jev rates its difficulty and picks the cheapest model that will handle it well.",
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const saved = (await cookies()).get(LANG_COOKIE)?.value
  const lang = isLang(saved) ? saved : DEFAULT_LANG

  return (
    <html lang={lang} className={`${onest.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LangProvider initial={lang}>
          <TooltipProvider>{children}</TooltipProvider>
        </LangProvider>
      </body>
    </html>
  )
}
