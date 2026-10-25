"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";
type Request={id:string;display_name:string;city:string;state_code:string;whatsapp:string;bio:string|null;published:boolean;publication_requested_at:string;profession_name:string|null};
export default function AdminPage(){
 const [items,setItems]=useState<Request[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[busy,setBusy]=useState<string|null>(null),[notice,setNotice]=useState("");
 async function load(){
  setLoading(true);setError("");
  try{
   const supabase=getSupabase();const {data:{user}}=await supabase.auth.getUser();
   if(!user)throw new Error("Entre na sua conta para acessar esta página.");
   const {data,error}=await supabase.rpc("admin_list_professionals");
   if(error)throw new Error([error.message,error.code&&"Código: "+error.code,error.details&&"Detalhes: "+error.details,error.hint&&"Dica: "+error.hint].filter(Boolean).join(" | "));
   setItems((data??[]) as Request[]);
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível carregar solicitações.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load()},[]);
 async function review(item:Request,approve:boolean){
  if(!window.confirm(approve?"Publicar o perfil de "+item.display_name+"?":"Retirar da busca o perfil de "+item.display_name+"?"))return;
  setBusy(item.id);setNotice("");setError("");
  try{
   const {error}=await getSupabase().rpc("admin_review_professional",{target_id:item.id,approve});
   if(error)throw error;
   setNotice(approve?"Perfil publicado com sucesso.":"Perfil retirado das buscas.");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Falha ao atualizar perfil.");}
  finally{setBusy(null);}
 }
 return <main className="wrap section" style={{maxWidth:920}}>
  <Link href="/">← Voltar ao início</Link><h1>Painel de aprovação</h1>
  <p className="muted">Solicitações de publicação de profissionais. Somente administradores autorizados podem acessar e aprovar.</p>
  {loading?<p>Carregando solicitações...</p>:error?<div className="card" role="alert"><strong>Não foi possível acessar o painel.</strong><p>{error}</p><button className="btn" onClick={()=>void load()}>Tentar novamente</button></div>:<>
   {notice&&<p role="status" style={{color:"#166534",fontWeight:700}}>{notice}</p>}
   <p><strong>{items.filter(x=>!x.published).length}</strong> solicitações aguardando publicação</p>
   {items.length===0?<div className="card">Nenhuma solicitação recebida até o momento.</div>:items.map(item=><article className="card" key={item.id} style={{marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",alignItems:"center"}}>
     <div><h2 style={{fontSize:21,margin:"0 0 6px"}}>{item.display_name}</h2><p className="muted" style={{margin:0}}>{item.profession_name??"Profissão não informada"} · {item.city}/{item.state_code}</p></div>
     <strong style={{color:item.published?"#166534":"#955e0a"}}>{item.published?"Publicado":"Aguardando aprovação"}</strong>
    </div>
    {item.bio&&<p>{item.bio}</p>}
    <p><strong>WhatsApp:</strong> {item.whatsapp}</p>
    <p className="muted" style={{fontSize:13}}>Solicitado em {new Date(item.publication_requested_at).toLocaleString("pt-BR")}</p>
    <button className="btn" disabled={busy!==null} onClick={()=>void review(item,!item.published)}>{busy===item.id?"Processando...":item.published?"Retirar da busca":"Aprovar e publicar"}</button>
   </article>)}
  </>}
 </main>;
}
