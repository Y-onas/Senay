/**
 * System → Admins page for st-hq (Clerk invite by name + email).
 * Patched into the admin bundle as function A7 before settings route wiring.
 */
function A7(){
  const{admin:actor}=x.useContext(Tx)||{};
  const[n,l]=x.useState([]);
  const[roles,setRoles]=x.useState([]);
  const[r,o]=x.useState(!0);
  const[creating,setCreating]=x.useState(!1);
  const[form,setForm]=x.useState({name:"",email:"",roleId:""});
  const[q,setQ]=x.useState("");
  const load=async()=>{
    let t=setTimeout(()=>o(!0),200);
    try{
      const[list,roleList]=await Promise.all([Ws.admins.list(),Ws.admins.roles()]);
      l(list);
      const inviteRoles=roleList.filter(v=>v.name==="Super Admin"||v.name==="Content Management");
      setRoles(inviteRoles);
      setForm(f=>({...f,roleId:f.roleId||inviteRoles.find(v=>v.name==="Content Management")?.id||inviteRoles[0]?.id||""}));
    }catch(e){we.error(e instanceof Error?e.message:"Failed to load admins")}
    finally{clearTimeout(t);o(!1)}
  };
  x.useEffect(()=>{load()},[]);
  const filtered=!q.trim()?n:n.filter(a=>a.name.toLowerCase().includes(q.toLowerCase())||a.email.toLowerCase().includes(q.toLowerCase()));
  const create=async()=>{
    if(!form.name.trim()||!form.email.trim()){we.error("Name and email are required");return}
    setCreating(!0);
    try{
      const created=await Ws.admins.create({name:form.name.trim(),email:form.email.trim().toLowerCase(),roleId:form.roleId||undefined,status:"ACTIVE"});
      l(s=>[created,...s]);
      setForm(f=>({name:"",email:"",roleId:f.roleId}));
      we.success("Admin invited — they can sign in with Google using this email");
    }catch(e){we.error(e instanceof Error?e.message:"Could not create admin")}
    finally{setCreating(!1)}
  };
  const save=async a=>{
    try{
      const saved=await Ws.admins.update(a.id,{name:a.name,email:a.email,roleId:a.role?.id||a.roleId,status:a.status,telegramChatId:a.telegramChatId??null});
      l(s=>s.map(v=>v.id===saved.id?saved:v));
      we.success("Admin saved");
    }catch(e){we.error(e instanceof Error?e.message:"Save failed")}
  };
  const toggle=async a=>{
    const status=a.status==="ACTIVE"?"SUSPENDED":"ACTIVE";
    try{
      const saved=await Ws.admins.update(a.id,{status});
      l(s=>s.map(v=>v.id===saved.id?saved:v));
      we.success(status==="ACTIVE"?"Admin enabled":"Admin suspended");
    }catch(e){we.error(e instanceof Error?e.message:"Update failed")}
  };
  const remove=async a=>{
    if(actor?.id===a.id){we.error("You cannot delete your own account");return}
    if(!(await adminConfirm({title:"Remove admin access?",description:`${a.email} will no longer be able to sign in to the admin panel.`,confirmLabel:"Remove access"})))return;
    try{
      await Ws.admins.delete(a.id);
      l(s=>s.filter(v=>v.id!==a.id));
      we.success("Admin removed");
    }catch(e){we.error(e instanceof Error?e.message:"Delete failed")}
  };
  if(r)return i.jsx(ht,{className:"h-96"});
  return i.jsxs("div",{className:"space-y-6 animate-fade-in",children:[
    i.jsxs("div",{className:"flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",children:[
      i.jsxs("div",{children:[
        i.jsx("p",{className:"text-xs uppercase tracking-[0.2em] text-burgundy/60",children:"System"}),
        i.jsx("h1",{className:"font-display text-3xl font-bold text-burgundy",children:"Admins"}),
        i.jsx("p",{className:"text-brown-muted max-w-2xl",children:"Two access levels: Super Admin (everything) or Content Management (site & content only — no System, Telegram, or Catalog)."})
      ]}),
      i.jsx(J,{placeholder:"Search name or email…",value:q,onChange:e=>setQ(e.target.value),className:"max-w-xs"})
    ]}),
    i.jsxs(Ke,{className:"p-4 space-y-4",children:[
      i.jsx(Mt,{className:"text-base",children:"Invite admin"}),
      i.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-3 items-end",children:[
        i.jsxs("div",{className:"space-y-1",children:[i.jsx(me,{children:"Name"}),i.jsx(J,{value:form.name,onChange:e=>setForm(f=>({...f,name:e.target.value})),placeholder:"Full name"})]}),
        i.jsxs("div",{className:"space-y-1",children:[i.jsx(me,{children:"Email (Google)"}),i.jsx(J,{type:"email",value:form.email,onChange:e=>setForm(f=>({...f,email:e.target.value})),placeholder:"name@gmail.com"})]}),
        i.jsxs("div",{className:"space-y-1",children:[i.jsx(me,{children:"Role"}),i.jsxs(Tt,{value:form.roleId,onValueChange:v=>setForm(f=>({...f,roleId:v})),children:[i.jsx(_t,{children:i.jsx(Rt,{})}),i.jsx(kt,{children:roles.map(role=>i.jsx(ke,{value:role.id,children:role.name},role.id))})]})]}),
        i.jsxs(re,{onClick:create,disabled:creating,children:[i.jsx(Qt,{className:"w-4 h-4 mr-2"}),creating?"Saving...":"Add admin"]})
      ]}),
      i.jsx("p",{className:"text-xs text-brown-muted",children:"After you add them, they open /st-hq/login and sign in with that Google account."})
    ]}),
    i.jsx("div",{className:"space-y-3",children:filtered.length?filtered.map(a=>i.jsx(Ke,{className:"p-4",children:i.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-3 items-end",children:[
      i.jsxs("div",{className:"lg:col-span-3 space-y-1",children:[i.jsx(me,{children:"Name"}),i.jsx(J,{value:a.name||"",onChange:e=>l(s=>s.map(v=>v.id===a.id?{...v,name:e.target.value}:v))})]}),
      i.jsxs("div",{className:"lg:col-span-3 space-y-1",children:[i.jsx(me,{children:"Email"}),i.jsx(J,{type:"email",value:a.email||"",onChange:e=>l(s=>s.map(v=>v.id===a.id?{...v,email:e.target.value}:v))})]}),
      i.jsxs("div",{className:"lg:col-span-2 space-y-1",children:[i.jsx(me,{children:"Role"}),i.jsxs(Tt,{value:a.role?.id||"",onValueChange:v=>l(s=>s.map(item=>item.id===a.id?{...item,role:{...(item.role||{}),id:v,name:roles.find(role=>role.id===v)?.name||item.role?.name}}:item)),children:[i.jsx(_t,{children:i.jsx(Rt,{})}),i.jsx(kt,{children:roles.map(role=>i.jsx(ke,{value:role.id,children:role.name},role.id))})]})]}),
      i.jsxs("div",{className:"lg:col-span-4 flex flex-wrap items-center gap-2",children:[
        i.jsx("span",{className:`rounded-full px-2.5 py-1 text-xs font-medium ${a.status==="ACTIVE"?"bg-green-100 text-green-800":"bg-amber-100 text-amber-800"}`,children:a.status}),
        i.jsxs(re,{size:"sm",onClick:()=>save({...a,roleId:a.role?.id}),children:[i.jsx(ha,{className:"w-3.5 h-3.5 mr-1"}),"Save"]}),
        i.jsx(re,{size:"sm",variant:"outline",onClick:()=>toggle(a),children:a.status==="ACTIVE"?"Suspend":"Enable"}),
        i.jsx(re,{size:"sm",variant:"ghost",onClick:()=>remove(a),children:i.jsx(Zt,{className:"w-4 h-4 text-destructive"})}),
        a.lastLoginAt?i.jsx("span",{className:"text-[11px] text-brown-muted",children:`Last login ${new Date(a.lastLoginAt).toLocaleString()}`}):i.jsx("span",{className:"text-[11px] text-brown-muted",children:"Never signed in"})
      ]})
    ]})},a.id)):i.jsx(Ke,{className:"p-8 text-center text-brown-muted",children:"No admins yet. Add the first email above."})})
  ]});
}
