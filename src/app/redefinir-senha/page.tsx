"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";
export default function RedefinirSenha(){
 const [ready,setReady]=useState(false);const [password,setPassword]=useState("");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 useEffect(()=>{const sb=getSupabase();let active=true;sb.auth.getSession().then(({data})=>{if(active&&data.session)setReady(true)});const {data:{subscription}}=sb.auth.onAuthStateChange((event,session)=>{if(active&&(event==="PASSWORD_RECOVERY"||!!session))setReady(true)});return()=>{active=false;subscription.unsubscribe()}},[]);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");try{const {error}=await getSupabase().auth.updateUser({password});if(error)throw error;setMessage("Senha alterada com sucesso. Você já pode acessar sua conta.");setPassword("")}catch(e){setMessage(e instanceof Error?e.message:"Não foi possível alterar sua senha.")}finally{setBusy(false)}}
 return <main className="wrap section" style={{maxWidth:540}}><Link href="/entrar">← Voltar ao login</Link><h1>Redefinir senha</h1>{ready?<form className="card" onSubmit={submit} style={{display:"grid",gap:14}}><label>Nova senha<input required type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label><button className="btn" disabled={busy}>{busy?"Salvando...":"Salvar nova senha"}</button>{message&&<p role="status">{message}</p>}</form>:<div className="card"><p>Abra o link de recuperação enviado para seu e-mail. Se o link expirou, solicite outro na página de login.</p><Link href="/entrar">Solicitar novo link</Link></div>}</main>
}