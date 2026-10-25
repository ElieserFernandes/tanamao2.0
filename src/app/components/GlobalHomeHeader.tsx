"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
export default function GlobalHomeHeader(){const pathname=usePathname();if(pathname==="/")return null;return <header className="global-home-header"><Link href="/" className="global-home-brand" aria-label="TÁNAMÃO — voltar à página inicial"><span className="global-home-hand" aria-hidden="true">✋</span><span>TÁNA<strong>MÃO</strong></span></Link><Link href="/" className="global-home-link">Início</Link></header>}
