"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";
type Photo={id:string;storage_path:string;caption:string|null};
const BUCKET="professional-media";
function explainUploadError(error:{message?:string;statusCode?:string|number;error?:string}){const detail=[error.message,error.error,error.statusCode?String(error.statusCode):""].filter(Boolean).join(" | ");if(/bucket not found/i.test(detail))return "O armazenamento de fotos ainda não foi criado. Execute o SQL 009 no Supabase. Detalhe: "+detail;if(/row.level.security|policy|permission|unauthorized|not authorized/i.test(detail))return "O Supabase recusou o envio por falta de permissão. Confira os SQLs 009, 013 e 014. Detalhe: "+detail;if(/mime|file.type|content.type/i.test(detail))return "Formato não aceito pelo armazenamento. Detalhe: "+detail;return "Erro no envio ao Supabase: "+detail;}
export default function FotosProfissionais(){
 const [userId,setUserId]=useState("");const [profileId,setProfileId]=useState("");const [photos,setPhotos]=useState<Photo[]>([]);const [logo,setLogo]=useState("");const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);const [message,setMessage]=useState("");const [progress,setProgress]=useState("");const [acknowledged,setAcknowledged]=useState(false);const [confirmBusy,setConfirmBusy]=useState(false);const [galleryLoaded,setGalleryLoaded]=useState(false);
 const sb=getSupabase();
 function url(path:string){return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl}
 async function refresh(pid:string,uid:string){const {data,error}=await sb.from("gallery_photos").select("id,storage_path,caption").eq("professional_id",pid).order("created_at");if(error){setGalleryLoaded(false);throw new Error("Não foi possível consultar o catálogo ("+error.code+"): "+error.message+". Verifique as permissões do SQL 014.");}setPhotos(data??[]);setGalleryLoaded(true);const path=uid+"/logo";const {data:files,error:logoError}=await sb.storage.from(BUCKET).list(uid,{search:"logo"});if(logoError){setMessage("Não foi possível consultar o logo: "+logoError.message+". Confirme que o bucket professional-media existe e execute o SQL 013.");}setLogo(files?.some(f=>f.name==="logo")?url(path)+"?v="+Date.now():"")}
 useEffect(()=>{let active=true;(async()=>{try{const {data:{user}}=await sb.auth.getUser();if(!user){window.location.replace("/entrar");return;}const {data,error}=await sb.from("professionals").select("id").eq("user_id",user.id).maybeSingle();if(error)throw error;if(active){setUserId(user.id);setProfileId(data?.id??"");if(data?.id){await refresh(data.id,user.id);const {data:status}=await sb.from("professionals").select("no_gallery_acknowledged_at").eq("id",data.id).single();if(active)setAcknowledged(Boolean(status?.no_gallery_acknowledged_at))}}}catch(e){if(active)setMessage(e instanceof Error?e.message:"Erro ao carregar imagens.")}finally{if(active)setLoading(false)}})();return()=>{active=false}},[]);
 async function upload(file:File|undefined,kind:"logo"|"gallery"){
  if(!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>3145728){setMessage("Escolha uma imagem JPG, PNG ou WebP de até 3 MB.");return;}
  setBusy(true);setMessage("");setProgress("Enviando imagem...");
  try{
   const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";
   const path=kind==="logo"?userId+"/logo":userId+"/"+crypto.randomUUID()+"."+ext;
   const {error}=await sb.storage.from(BUCKET).upload(path,file,{upsert:kind==="logo",contentType:file.type});
   if(error)throw new Error(explainUploadError(error));
   if(kind==="gallery"){const {error:dbError}=await sb.from("gallery_photos").insert({professional_id:profileId,storage_path:path,visible:true});if(dbError){await sb.storage.from(BUCKET).remove([path]);throw dbError}}
   await refresh(profileId,userId);setMessage(kind==="logo"?"Logo cadastrado! Você pode substituí-lo quando quiser.":"Foto adicionada ao catálogo!");
  }catch(e){setMessage(e instanceof Error?e.message:"Não foi possível enviar a imagem.")}finally{setBusy(false);setProgress("")}
 }
 async function uploadGallery(files:FileList|null){
  if(!files?.length)return;
  if(!galleryLoaded){setMessage("Não é possível enviar fotos enquanto o catálogo não carregar. Tente novamente após corrigir o acesso.");return;}
  const selected=Array.from(files),remaining=Math.max(0,5-photos.length);
  if(!remaining){setMessage("O catálogo já tem 5 fotos. Exclua alguma para adicionar outra.");return;}
  if(selected.length>remaining){setMessage("Você selecionou "+selected.length+" fotos, mas restam "+remaining+" vagas. Selecione até "+remaining+".");return;}
  const invalid=selected.find(f=>!["image/jpeg","image/png","image/webp"].includes(f.type)||f.size>3145728);
  if(invalid){setMessage("Todas as fotos devem ser JPG, PNG ou WebP e ter até 3 MB cada.");return;}
  setBusy(true);setMessage("");let count=0;let failure="";
  try{
   for(const [index,file] of selected.entries()){
    setProgress("Enviando foto "+(index+1)+" de "+selected.length+"...");
    const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";
    const path=userId+"/"+crypto.randomUUID()+"."+ext;
    const {error}=await sb.storage.from(BUCKET).upload(path,file,{contentType:file.type});
    if(error){failure=explainUploadError(error);break;}
    const {error:dbError}=await sb.from("gallery_photos").insert({professional_id:profileId,storage_path:path,visible:true});
    if(dbError){await sb.storage.from(BUCKET).remove([path]);failure=dbError.message;break;}
    count++;
   }
   await refresh(profileId,userId);
   setMessage(count+" foto(s) adicionada(s) ao catálogo."+ (failure?" Falha ao enviar as demais: "+failure:""));
  }catch(e){setMessage(count+" foto(s) enviada(s). "+(e instanceof Error?e.message:"Erro ao enviar as demais."));try{await refresh(profileId,userId)}catch{}}
  finally{setBusy(false);setProgress("")}
 }
 async function acknowledgeNoPhotos(){if(!window.confirm("Confirma que deseja continuar sem fotos dos serviços?"))return;setConfirmBusy(true);setMessage("");try{const {error}=await sb.rpc("confirm_professional_without_photos");if(error)throw error;setAcknowledged(true);setMessage("Sua escolha foi registrada. Agora revise e publique seu perfil.");}catch(e){setMessage(e instanceof Error?e.message:"Não foi possível confirmar. Execute o SQL 012 no Supabase.")}finally{setConfirmBusy(false)}}
 async function removePhoto(photo:Photo){if(!confirm("Excluir esta foto do catálogo?"))return;setBusy(true);setMessage("");try{const {error}=await sb.from("gallery_photos").delete().eq("id",photo.id).eq("professional_id",profileId);if(error)throw error;await sb.storage.from(BUCKET).remove([photo.storage_path]);await refresh(profileId,userId);setMessage("Foto excluída.")}catch(e){setMessage(e instanceof Error?e.message:"Não foi possível excluir.")}finally{setBusy(false)}}
 if(loading)return <main className="wrap section">Carregando suas fotos...</main>;
 if(!profileId)return <main className="wrap section"><h1>Fotos do seu trabalho</h1><p>Primeiro salve seus dados profissionais.</p><Link className="btn" href="/cadastro">Preencher cadastro profissional</Link></main>;
 return <main className="wrap section" style={{maxWidth:760}}><Link href="/cadastro">← Voltar ao cadastro</Link><h1>Fotos do seu trabalho</h1><p className="muted">Etapa 2 de 3 — Adicione seu logo e até 5 fotos de serviços. Depois, finalize a publicação. O cadastro ainda não está concluído.</p>
 {!galleryLoaded&&<div role="alert" style={{padding:16,background:"#fff0e8",borderRadius:12,marginBottom:16}}><strong>Não foi possível carregar as fotos salvas.</strong><p>{message||"Verifique a conexão e as permissões do catálogo."}</p><button type="button" className="share" onClick={()=>window.location.reload()}>Tentar novamente</button></div>}<section className="card" style={{marginTop:18}}><h2>Logo da empresa (opcional)</h2><p className="muted">Envie uma imagem quadrada com o nome ou símbolo da empresa.</p>{logo&&<img src={logo} alt="Logo atual da empresa" style={{width:110,height:110,objectFit:"contain",borderRadius:12,border:"1px solid #dbe3ed",marginBottom:12}}/>}<label style={{display:"block"}}>{logo?"Substituir logo":"Adicionar logo"}<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{void upload(e.target.files?.[0],"logo");e.target.value=""}} style={{display:"block",marginTop:8,maxWidth:"100%"}}/></label></section>
 <section className="card" style={{marginTop:18}}><h2>Fotos dos serviços ({galleryLoaded?photos.length+"/5":"não carregadas"}) {photos.length>0?"✓ Salvas": "— Pendentes"}</h2><p className="muted">Mostre trabalhos realizados. Use apenas fotos que você tem autorização para publicar. Máximo de 3 MB por foto.</p>{photos.length<5&&<label style={{display:"block",marginBottom:16}}>{photos.length?"Adicionar mais fotos ("+(5-photos.length)+" vaga(s) restante(s))":"Adicionar fotos ao catálogo"}<input disabled={busy} multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{void uploadGallery(e.target.files);e.target.value=""}} style={{display:"block",marginTop:8,maxWidth:"100%"}}/></label>}
 {galleryLoaded&&photos.length===5&&<p style={{color:"#166534",fontWeight:700}}>✓ Catálogo completo: 5 de 5 fotos cadastradas.</p>}<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))",gap:12}}>{photos.map(p=><div key={p.id} style={{border:"1px solid #dbe3ed",borderRadius:12,padding:8}}><img src={url(p.storage_path)} alt={p.caption||"Foto de serviço"} style={{width:"100%",aspectRatio:"1",objectFit:"cover",borderRadius:8}}/><button type="button" className="share" disabled={busy} onClick={()=>void removePhoto(p)} style={{width:"100%",marginTop:8}}>Excluir foto</button></div>)}</div></section>
 {galleryLoaded&&photos.length===0&&<div style={{marginTop:18,padding:16,borderRadius:12,background:"#fff6e5"}}><strong>⚠️ Você ainda não cadastrou fotos dos serviços.</strong><p>As fotos ajudam os clientes a conhecer seu trabalho. Se não tiver imagens agora, confirme que deseja continuar sem elas.</p><button type="button" className="share" disabled={busy||confirmBusy||acknowledged} onClick={()=>void acknowledgeNoPhotos()}>{acknowledged?"✓ Estou ciente: continuar sem fotos":confirmBusy?"Confirmando...":"Estou ciente de que não adicionei fotos"}</button></div>}{photos.length>0&&<p style={{color:"#166534",fontWeight:700,marginTop:18}}>✓ {photos.length} foto(s) salva(s) no catálogo. Você já pode continuar para a finalização.</p>}
 {progress&&<p role="status" style={{marginTop:16,fontWeight:700}}>{progress}</p>}{message&&<p role="status" style={{marginTop:16}}>{message}</p>}
 <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:24}}>{(galleryLoaded&&(photos.length>0||acknowledged))?<Link className="btn" href="/cadastro">Etapa 3 — Revisar e publicar →</Link>:<span style={{padding:14,background:"#e9edf4",borderRadius:10,color:"#64748b"}}>Para continuar, envie fotos ou confirme que está ciente.</span>}<Link className="btn secondary" href="/minha-conta">Minha conta</Link></div></main>
}
