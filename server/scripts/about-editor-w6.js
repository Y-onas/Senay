function w6(){
  const defaults={
    eyebrow:"About Us",
    title:"The story of Senay Tela",
    description:"A family kitchen keeping Ethiopian tradition alive — one stew, one ceremony, one celebration at a time.",
    sectionLabel:"Who we are",
    sectionTitle:"More than a restaurant — a living tradition",
    paragraphs:[
      "Senay Tela was born from a simple wish: to share the food and drink that bring Ethiopian families together.",
      "Every dish that leaves our kitchen carries the same care it would in a family home."
    ],
    values:[
      {title:"Cooked slowly",text:"Our wats simmer for hours in seasoned clay, just as they have for generations."},
      {title:"Brewed in-house",text:"We ferment our own tela and tej — never bought, always fresh from the pot."},
      {title:"Honest ingredients",text:"Stone-ground spices, fresh produce and no shortcuts. Many dishes are fully vegan."},
      {title:"Genuine hospitality",text:"You are welcomed as family. Sharing food is the whole point."}
    ],
    milestones:[
      {year:"2011",text:"Senay Tela opens its doors with a single clay pot and a family recipe book."},
      {year:"2016",text:"We begin brewing our own tela and tej, becoming a neighbourhood favourite."},
      {year:"2020",text:"Our catering service launches, serving weddings and holidays across Addis."},
      {year:"Today",text:"We bring tradition to your table — in the restaurant, at home, and at your events."}
    ]
  };
  const [draft,setDraft]=x.useState(defaults);
  const [loading,setLoading]=x.useState(!0);
  const [saving,setSaving]=x.useState(!1);
  x.useEffect(()=>{
    Ws.settings.get("page:about").then(data=>{
      const d=data||{};
      setDraft({
        eyebrow:d.eyebrow||defaults.eyebrow,
        title:d.title||defaults.title,
        description:d.description||defaults.description,
        sectionLabel:d.sectionLabel||defaults.sectionLabel,
        sectionTitle:d.sectionTitle||defaults.sectionTitle,
        paragraphs:Array.isArray(d.paragraphs)&&d.paragraphs.length?d.paragraphs:defaults.paragraphs,
        values:Array.isArray(d.values)&&d.values.length?d.values:defaults.values,
        milestones:Array.isArray(d.milestones)&&d.milestones.length?d.milestones:defaults.milestones
      });
    }).finally(()=>setLoading(!1));
  },[]);
  const kvRows=(items,onChange,fieldA,fieldB,labelA,labelB,placeholderA,placeholderB)=>items.map((item,idx)=>i.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end",children:[i.jsxs("div",{className:"space-y-1",children:[i.jsx(me,{className:"text-xs",children:labelA}),i.jsx(J,{value:item[fieldA]||"",placeholder:placeholderA,onChange:e=>{const next=[...items];next[idx]={...next[idx],[fieldA]:e.target.value};onChange(next)}})]}),i.jsxs("div",{className:"space-y-1",children:[i.jsx(me,{className:"text-xs",children:labelB}),i.jsx(J,{value:item[fieldB]||"",placeholder:placeholderB,onChange:e=>{const next=[...items];next[idx]={...next[idx],[fieldB]:e.target.value};onChange(next)}})]}),i.jsx(re,{size:"sm",variant:"ghost",onClick:()=>onChange(items.filter((_,j)=>j!==idx)),children:i.jsx(Zt,{className:"w-4 h-4 text-destructive"})})]},`${fieldA}-${idx}`));
  const save=async()=>{
    setSaving(!0);
    try{
      const payload={
        eyebrow:draft.eyebrow.trim(),
        title:draft.title.trim(),
        description:draft.description.trim(),
        sectionLabel:draft.sectionLabel.trim(),
        sectionTitle:draft.sectionTitle.trim(),
        paragraphs:draft.paragraphs.map(p=>p.trim()).filter(Boolean),
        values:draft.values.filter(v=>v.title.trim()||v.text.trim()).map(v=>({title:v.title.trim(),text:v.text.trim()})),
        milestones:draft.milestones.filter(m=>m.year.trim()||m.text.trim()).map(m=>({year:m.year.trim(),text:m.text.trim()}))
      };
      await Ws.settings.update("page:about",payload);
      setDraft(payload);
      we.success("About page saved");
    }finally{setSaving(!1)}
  };
  const paragraphsText=(draft.paragraphs||[]).join("\n\n");
  if(loading)return i.jsx(ht,{className:"h-96"});
  return i.jsxs("div",{className:"space-y-6 animate-fade-in",children:[i.jsxs("div",{className:"flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",children:[i.jsxs("div",{children:[i.jsx("h1",{className:"font-display text-3xl font-bold text-burgundy",children:"About Us"}),i.jsx("p",{className:"text-brown-muted",children:"Edit the full About page — hero, story, values and timeline."})]}),i.jsxs(re,{onClick:save,disabled:saving,children:[i.jsx(ha,{className:"w-4 h-4 mr-2"}),saving?"Saving...":"Save About page"]})]}),i.jsx(Ke,{className:"border-yellow-brand/30 bg-yellow-brand/5 p-4",children:i.jsxs("p",{className:"text-sm text-brown-muted",children:["The homepage About preview is edited under ",i.jsx(ci,{to:"/",className:"font-semibold text-burgundy underline",children:"Home → About Preview"}),". Story images and value icons stay fixed in the theme for now. Timeline section labels are also fixed."]})}),i.jsxs(Ke,{children:[i.jsx(Ot,{children:i.jsx(Mt,{children:"Page heading"})}),i.jsxs(xt,{className:"space-y-4",children:[i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Eyebrow"}),i.jsx(J,{value:draft.eyebrow,onChange:e=>setDraft(d=>({...d,eyebrow:e.target.value}))})]}),i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Title"}),i.jsx(J,{value:draft.title,onChange:e=>setDraft(d=>({...d,title:e.target.value}))})]}),i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Description"}),i.jsx(Vn,{value:draft.description,onChange:e=>setDraft(d=>({...d,description:e.target.value})),rows:3})]})]})]}),i.jsxs(Ke,{children:[i.jsx(Ot,{children:i.jsxs("div",{children:[i.jsx(Mt,{children:"Our story"}),i.jsx("p",{className:"text-sm text-brown-muted font-normal",children:"Main text block on the About page"})]})}),i.jsxs(xt,{className:"space-y-4",children:[i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Section small label"}),i.jsx(J,{value:draft.sectionLabel,onChange:e=>setDraft(d=>({...d,sectionLabel:e.target.value}))})]}),i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Section title"}),i.jsx(J,{value:draft.sectionTitle,onChange:e=>setDraft(d=>({...d,sectionTitle:e.target.value}))})]}),i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Story paragraphs"}),i.jsx(Vn,{value:paragraphsText,rows:6,onChange:e=>setDraft(d=>({...d,paragraphs:e.target.value.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean)})),placeholder:"First paragraph\n\nSecond paragraph"}),i.jsx("p",{className:"text-xs text-brown-muted",children:"Press Enter twice between paragraphs"})]})]})]}),i.jsxs(Ke,{children:[i.jsx(Ot,{children:i.jsxs("div",{children:[i.jsx(Mt,{children:"Our values"}),i.jsx("p",{className:"text-sm text-brown-muted font-normal",children:"Four boxes with title + description"})]})}),i.jsxs(xt,{className:"space-y-3",children:[kvRows(draft.values,next=>setDraft(d=>({...d,values:next})),"title","text","Title","Description","Value name","Short explanation"),i.jsx(re,{size:"sm",variant:"outline",onClick:()=>setDraft(d=>({...d,values:[...d.values,{title:"",text:""}]})),children:"+ Add value"})]})]}),i.jsxs(Ke,{children:[i.jsx(Ot,{children:i.jsxs("div",{children:[i.jsx(Mt,{children:"Timeline"}),i.jsx("p",{className:"text-sm text-brown-muted font-normal",children:"Key dates in your history"})]})}),i.jsxs(xt,{className:"space-y-3",children:[kvRows(draft.milestones,next=>setDraft(d=>({...d,milestones:next})),"year","text","Year","What happened","2011","What happened"),i.jsx(re,{size:"sm",variant:"outline",onClick:()=>setDraft(d=>({...d,milestones:[...d.milestones,{year:"",text:""}]})),children:"+ Add milestone"})]})]})]});
}
