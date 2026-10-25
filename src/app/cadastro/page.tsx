"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

type Profession = {id:string;name:string};
export default function Cadastro(){
 const [userId,setUserId]=useState<string|null>(null);const [isPublished,setIsPublished]=useState(false);const [profileId,setProfileId]=useState<string|null>(null);const [requestedAt,setRequestedAt]=useState<string|null>(null);const [requestBusy,setRequestBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [name,setName]=useState("");const [fullName,setFullName]=useState("");const [companyName,setCompanyName]=useState("");const [professionId,setProfessionId]=useState("");
 const [professions,setProfessions]=useState<Profession[]>([]);const [customProfession,setCustomProfession]=useState("");const [suggestion,setSuggestion]=useState("");const [suggestBusy,setSuggestBusy]=useState(false);const [suggestMessage,setSuggestMessage]=useState("");
 const [city,setCity]=useState("");const [uf,setUf]=useState("");
 const [whatsapp,setWhatsapp]=useState("");const [bio,setBio]=useState("");
 const [message,setMessage]=useState("");const [showSuccess,setShowSuccess]=useState(false);const [busy,setBusy]=useState(false);const [loadError,setLoadError]=useState("");
 useEffect(()=>{
  let active=true;
  async function load(){
   try{
    const supabase=getSupabase();
    const {data:{user},error:userError}=await supabase.auth.getUser();
    if(userError)throw userError;
    if(!active)return;
    setUserId(user?.id??null);
    const {data:options,error:professionsError}=await supabase.from("professions").select("id,name").eq("active",true).order("name");
    if(professionsError)throw new Error("Erro ao consultar profissões: "+professionsError.message+" (código "+(professionsError.code||"indisponível")+")");
    if(active)setProfessions(options??[]);
    if(user){
     const {data:existing,error:existingError}=await supabase.from("professionals").select("id,display_name,full_name,company_name,profession_id,custom_profession,city,state_code,whatsapp,bio,publication_requested_at,published,review_status").eq("user_id",user.id).maybeSingle();
     if(existingError)throw new Error("Erro ao consultar seu perfil: "+existingError.message+" (código "+(existingError.code||"indisponível")+")");
     if(existing&&active){setProfileId(existing.id);setIsPublished(Boolean(existing.published));setRequestedAt(existing.publication_requested_at??null);setName(existing.display_name??"");setFullName(existing.full_name??"");setCompanyName(existing.company_name??"");setProfessionId(existing.profession_id??"");setCustomProfession(existing.custom_profession??"");setCity(existing.city??"");setUf(existing.state_code??"");setWhatsapp(existing.whatsapp??"");setBio(existing.bio??"");}
    }
   }catch(e){if(active)setLoadError(e instanceof Error?e.message:"Não foi possível carregar seu cadastro.")}
   finally{if(active)setLoading(false)}
  }
  void load();return()=>{active=false};
 },[]);
 async function save(e:React.FormEvent){
  e.preventDefault();if(!userId)return;
  setBusy(true);setMessage("");
  try{
   if(fullName.trim().length<3)throw new Error("Informe nome e sobrenome.");
   if(!professionId)throw new Error("Escolha sua profissão principal.");
   const otherSelected=professions.some(p=>p.id===professionId&&p.name.toLocaleLowerCase("pt-BR")==="outro");
   if(otherSelected&&customProfession.trim().length<3)throw new Error("Informe sua profissão no campo Qual é sua profissão?.");
   const supabase=getSupabase();
   const {data:existing,error:lookupError}=await supabase.from("professionals").select("id,slug").eq("user_id",userId).maybeSingle();
   if(lookupError)throw lookupError;
   const number=whatsapp.replace(/\D/g,"");
   if(number.length<10||number.length>13)throw new Error("Informe um WhatsApp com DDD válido.");
   const payload={user_id:userId,display_name:(companyName.trim()||name.trim()),full_name:fullName.trim(),company_name:companyName.trim(),slug:existing?.slug??("profissional-"+userId.slice(0,12)),profession_id:professionId,custom_profession:otherSelected?customProfession.trim():null,city:city.trim(),state_code:uf.toUpperCase().trim(),whatsapp:number,bio:bio.trim()};
   if(existing){const {error}=await supabase.from("professionals").update(payload).eq("id",existing.id);if(error)throw error;setProfileId(existing.id)}
   else{const {data:created,error}=await supabase.from("professionals").insert(payload).select("id").single();if(error)throw error;setProfileId(created.id)}
   setShowSuccess(true);
  }catch(e){setMessage(e instanceof Error?e.message:"Não foi possível salvar. Tente novamente.")}
  finally{setBusy(false)}
 }
 async function suggestProfession(){const value=suggestion.trim();if(value.length<3){setSuggestMessage("Informe o nome da profissão.");return;}if(professions.some(p=>p.name.toLocaleLowerCase("pt-BR")===value.toLocaleLowerCase("pt-BR"))){setSuggestMessage("Esta profissão já está disponível na lista.");return;}setSuggestBusy(true);setSuggestMessage("");try{const {error}=await getSupabase().from("profession_suggestions").insert({user_id:userId,name:value});if(error)throw error;setSuggestMessage("Sugestão enviada! Nossa equipe avaliará a inclusão. Você poderá concluir o cadastro profissional quando ela estiver disponível.");setSuggestion("");}catch(e){setSuggestMessage(e instanceof Error?e.message:"Não foi possível enviar. Verifique o SQL 010 no Supabase.")}finally{setSuggestBusy(false)}}
 async function requestPublication(){
 if(!profileId)return;
 setRequestBusy(true);setMessage("");
 try{
  const {data,error}=await getSupabase().rpc("request_professional_publication");
  if(error)throw error;
  const status=String(data);
  setRequestedAt(new Date().toISOString());
  if(status==="published"){setIsPublished(true);setMessage("Seu perfil foi publicado e já pode aparecer nas buscas!");}
  else if(status==="manual_review"){setMessage("Solicitação recebida. Seu cadastro precisa de verificação antes de aparecer nas buscas.");}
  else if(status==="suspended"){setMessage("Seu perfil está suspenso. Solicite uma revisão ao suporte.");}
  else setMessage("Sua solicitação foi registrada.");
 }catch(e){setMessage(e instanceof Error?e.message:"Não foi possível solicitar a publicação.");}
 finally{setRequestBusy(false);}
 }

 if(loading)return <main className="wrap section">Carregando cadastro...</main>;
 if(!userId)return <main className="wrap section"><h1>Divulgue seus serviços</h1><p>Entre ou crie sua conta gratuita para continuar.</p><Link className="btn" href="/entrar">Entrar ou criar conta</Link></main>;
 return <main className="wrap section" style={{maxWidth:650}}>
 <Link href="/">← Voltar ao início</Link><h1>Divulgue seus serviços</h1>
 <p className="muted">Conte um pouco sobre seu trabalho. Você poderá atualizar essas informações depois.</p>
 <form className="card" onSubmit={save} style={{display:"grid",gap:14}}>
 <label>Nome e sobrenome<input required minLength={3} value={fullName} onChange={e=>setFullName(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label><label>Nome da empresa (opcional)<input value={companyName} onChange={e=>setCompanyName(e.target.value)} maxLength={120} style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label><label>Nome de divulgação<input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label>
 <label>Profissão principal<select required value={professionId} onChange={e=>setProfessionId(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:5}}><option value="">Selecione sua profissão</option>{professions.filter(p=>p.name.toLocaleLowerCase("pt-BR")!=="outro").map(p=><option key={p.id} value={p.id}>{p.name}</option>)}{professions.filter(p=>p.name.toLocaleLowerCase("pt-BR")==="outro").map(p=><option key={p.id} value={p.id}>Outro — minha profissão não está na lista</option>)}</select></label>{professions.some(p=>p.id===professionId&&p.name.toLocaleLowerCase("pt-BR")==="outro")&&<label>Qual é sua profissão?<input required minLength={3} maxLength={80} placeholder="Ex.: Marketing, Instalador de energia solar" value={customProfession} onChange={e=>setCustomProfession(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:5}}/><span className="muted">Sua profissão será exibida no perfil e poderá ser encontrada na busca.</span></label>}
 <label>Cidade<input required value={city} onChange={e=>setCity(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label>
 <label>Estado (UF)<input required maxLength={2} minLength={2} value={uf} onChange={e=>setUf(e.target.value)} placeholder="SP" style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label>
 <label>WhatsApp com DDD<input required value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="15999999999" style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label>
 <label>Sobre seu trabalho<textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} style={{display:"block",width:"100%",padding:12,marginTop:5}}/></label>
 <button className="btn" disabled={busy||professions.length===0}>{busy?"Salvando...":"Salvar cadastro"}</button>
 {professions.length===0&&<p className="muted">As profissões ainda não foram carregadas. Precisamos atualizar o banco de dados.</p>}
 {loadError&&<p role="alert" style={{color:"#a32222",overflowWrap:"anywhere"}}><strong>Problema na conexão com o banco:</strong> {loadError} <button type="button" onClick={()=>window.location.reload()} style={{textDecoration:"underline",marginLeft:8}}>Tentar novamente</button></p>}{message&&<p role="alert">{message}</p>}
 </form>{profileId&&<section className="card" style={{marginTop:20}}><h2 style={{fontSize:22,marginTop:0}}>Etapa 2 — Logo e fotos dos serviços</h2><p className="muted">Adicione o logo da empresa e até 5 fotos dos seus trabalhos. Esta etapa é opcional e pode ser concluída depois.</p><Link className="btn" href="/cadastro/fotos">Adicionar logo e fotos</Link></section>}{profileId&&<section className="card" style={{marginTop:20}}><h2 style={{fontSize:22,marginTop:0}}>Próximo passo: publicar seu perfil</h2><p className="muted">Confira seus dados acima antes de solicitar a publicação. O sistema verificará seus dados. Alguns perfis poderão precisar de análise antes da publicação.</p>{isPublished?<p style={{color:"#166534",fontWeight:700}}>✓ Seu perfil está publicado e pode aparecer nas buscas.</p>:requestedAt?<p style={{color:"#166534",fontWeight:700}}>✓ Solicitação recebida. Seu perfil aguarda verificação.</p>:<button type="button" className="btn" disabled={requestBusy||busy} onClick={requestPublication}>{requestBusy?"Enviando...":"Solicitar publicação"}</button>}{message&&<p role="status">{message}</p>}</section>}{showSuccess&&<div role="presentation" style={{position:"fixed",inset:0,background:"rgba(10,23,43,.6)",display:"grid",placeItems:"center",zIndex:1000,padding:20}} onClick={()=>setShowSuccess(false)}><div role="dialog" aria-modal="true" aria-labelledby="success-title" onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,padding:"32px 26px",maxWidth:420,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.25)",position:"relative"}}><button type="button" aria-label="Fechar" onClick={()=>setShowSuccess(false)} style={{position:"absolute",right:16,top:12,fontSize:26,color:"#64748b",background:"none",border:0,cursor:"pointer"}}>×</button><div aria-hidden="true" style={{width:76,height:76,background:"#16a34a",borderRadius:"50%",color:"white",display:"grid",placeItems:"center",fontSize:48,fontWeight:700,margin:"0 auto 20px"}}>✓</div><h2 id="success-title" style={{fontSize:26,marginBottom:12}}>Cadastro salvo com sucesso!</h2><p style={{color:"#52647c",lineHeight:1.6,marginBottom:24}}>Seus dados foram salvos. Agora você pode adicionar o logo e até 5 fotos dos serviços na Etapa 2. Depois, volte para revisar e solicitar a publicação.</p><button type="button" className="btn" onClick={()=>setShowSuccess(false)} style={{width:"100%"}}>OK</button></div></div>}</main>;
}
