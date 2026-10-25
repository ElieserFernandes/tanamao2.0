"use client";
import { useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
export default function Entrar(){
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [mode,setMode]=useState<"login"|"register">("login");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");try{
 const supabase=getSupabase();
 const {data,error}=mode==="register"?await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/"}}):await supabase.auth.signInWithPassword({email,password});
 if(error)throw error;
 if(data.session)window.location.href="/minha-conta";
 else if(mode==="register")setMessage("Conta criada. Se ainda não conseguir entrar, verifique se a confirmação de e-mail está desativada no Supabase.");
 else setMessage("Não foi possível iniciar a sessão. Tente novamente.");
 }catch(e){setMessage(e instanceof Error?e.message:"Não foi possível continuar.")}finally{setBusy(false)}}
 async function google(){setMessage("");try{const {error}=await getSupabase().auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin+"/"}});if(error)throw error}catch(e){setMessage(e instanceof Error?e.message:"Falha ao entrar com Google.")}}
 return <main className="wrap section" style={{maxWidth:550}}><Link href="/">← Voltar ao início</Link><h1>{mode==="login"?"Entrar no TÁNAMÃO":"Criar conta gratuita"}</h1><p className="muted">Use a mesma conta para encontrar serviços ou divulgar seu trabalho.</p><form className="card" onSubmit={submit} style={{display:"grid",gap:14}}><label>E-mail<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label><label>Senha<input required type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label><button className="btn" disabled={busy}>{busy?"Aguarde...":mode==="login"?"Entrar":"Criar conta"}</button><button type="button" className="btn secondary" onClick={google}>Continuar com Google</button><button type="button" className="share" onClick={()=>{setMode(mode==="login"?"register":"login");setMessage("")}}>{mode==="login"?"Ainda não tenho conta":"Já tenho conta"}</button>{message&&<p role="status">{message}</p>}</form><p className="muted">O acesso com Google será disponibilizado após a configuração do provedor.</p></main>
}