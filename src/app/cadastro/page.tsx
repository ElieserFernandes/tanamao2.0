"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
export default function Cadastro(){
 const [userId,setUserId]=useState<string|null>(null);const [loading,setLoading]=useState(true);
 const [name,setName]=useState("");const [profession,setProfession]=useState("");const [city,setCity]=useState("");const [uf,setUf]=useState("");const [whatsapp,setWhatsapp]=useState("");const [bio,setBio]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 useEffect(()=>{getSupabase().auth.getUser().then(({data})=>{setUserId(data.user?.id??null);setLoading(false)}).catch(()=>{setMessage("Não foi possível verificar sua sessão.");setLoading(false)})},[]);
 async function save(e:React.FormEvent){e.preventDefault();if(!userId)return;setBusy(true);setMessage("");try{
 const supabase=getSupabase();
 const {data:existing,error:lookupError}=await supabase.from("professionals").select("id,slug").eq("user_id",userId).maybeSingle();if(lookupError)throw lookupError;
 const slug=existing?.slug??("profissional-"+userId.slice(0,12));
 const payload={user_id:userId,display_name:name.trim(),slug,city:city.trim(),state_code:uf.toUpperCase().trim(),whatsapp:whatsapp.replace(/\D/g,""),bio:bio.trim(),published:false};
 if(payload.whatsapp.length<10||payload.whatsapp.length>13)throw new Error("Informe um WhatsApp com DDD válido.");
 if(existing){const {error}=await supabase.from("professionals").update(payload).eq("id",existing.id);if(error)throw error}
 else{const {error}=await supabase.from("professionals").insert(payload);if(error)throw error}
 setMessage("Rascunho salvo! Seu perfil ainda não está publicado. A verificação de contato e a escolha de profissão serão adicionadas nas próximas etapas.");
 }catch(e){setMessage(e instanceof Error?e.message:JSON.stringify(e))}finally{setBusy(false)}}
 if(loading)return <main className="wrap section">Verificando acesso...</main>;
 if(!userId)return <main className="wrap section"><h1>Cadastro profissional</h1><p>Entre na sua conta para cadastrar seus serviços.</p><Link className="btn" href="/entrar">Entrar ou criar conta</Link></main>;
 return <main className="wrap section" style={{maxWidth:650}}><Link href="/">← Início</Link><h1>Seu perfil profissional</h1><p className="muted">Preencha os dados básicos. Seu cadastro será salvo como rascunho e não ficará público nesta etapa.</p><form className="card" onSubmit={save} style={{display:"grid",gap:14}}>
 <label>Nome profissional<input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} style={{display:"block",width:"100%",padding:12}}/></label>
 <label>Profissão principal (em preparação)<input value={profession} onChange={e=>setProfession(e.target.value)} placeholder="Ex.: Pintor" disabled style={{display:"block",width:"100%",padding:12}}/></label>
 <label>Cidade<input required value={city} onChange={e=>setCity(e.target.value)} style={{display:"block",width:"100%",padding:12}}/></label>
 <label>UF<input required maxLength={2} minLength={2} value={uf} onChange={e=>setUf(e.target.value)} placeholder="SP" style={{display:"block",width:"100%",padding:12}}/></label>
 <label>WhatsApp com DDD<input required value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="15999999999" style={{display:"block",width:"100%",padding:12}}/></label>
 <label>Sobre seu trabalho<textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} style={{display:"block",width:"100%",padding:12}}/></label>
 <button className="btn" disabled={busy}>{busy?"Salvando...":"Salvar rascunho"}</button>{message&&<p role="status">{message}</p>}</form></main>
}