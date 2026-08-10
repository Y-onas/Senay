/**
 * Bilingual blog editor (st-hq admin). Source of truth for patching function c5
 * into app/public/st-hq/assets/index-*.js — keep in sync with scripts/patch-blog-editor-i18n.mjs
 */
function c5(){
  const mkId=()=>`blk-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const asL=v=>{
    if(v&&typeof v==="object"&&!Array.isArray(v)&&("en"in v||"am"in v))return{en:typeof v.en==="string"?v.en:"",am:typeof v.am==="string"?v.am:""};
    if(typeof v==="string")return{en:v,am:""};
    return{en:"",am:""};
  };
  const setL=(v,lang,text)=>({...asL(v),[lang]:text});
  const LField=({label,value,onChange,rows})=>i.jsxs("div",{className:"space-y-3 rounded-lg border border-burgundy/10 bg-cream/40 p-3",children:[
    i.jsxs("div",{className:"space-y-1",children:[i.jsx(me,{className:"text-xs uppercase tracking-wide text-burgundy",children:`English${label?` · ${label}`:""}`}),rows?i.jsx(Vn,{value:asL(value).en,rows,onChange:e=>onChange(setL(value,"en",e.target.value))}):i.jsx(J,{value:asL(value).en,onChange:e=>onChange(setL(value,"en",e.target.value))})]}),
    i.jsxs("div",{className:"space-y-1",children:[i.jsx(me,{className:"text-xs uppercase tracking-wide text-burgundy",children:`Amharic${label?` · ${label}`:""}`}),rows?i.jsx(Vn,{value:asL(value).am,rows,onChange:e=>onChange(setL(value,"am",e.target.value))}):i.jsx(J,{value:asL(value).am,onChange:e=>onChange(setL(value,"am",e.target.value))})]})
  ]});
  const normalizeBlock=b=>{
    if(!b||typeof b!=="object")return b;
    if(b.type==="paragraph")return{...b,text:asL(b.text)};
    if(b.type==="heading")return{...b,text:asL(b.text)};
    if(b.type==="quote")return{...b,text:asL(b.text),attribution:asL(b.attribution)};
    if(b.type==="list")return{...b,items:(b.items||[]).map(asL)};
    if(b.type==="image")return{...b,caption:asL(b.caption)};
    if(b.type==="gallery"||b.type==="columns")return{...b,images:(b.images||[]).map(img=>({...img,caption:asL(img.caption)}))};
    if(b.type==="cta")return{...b,text:asL(b.text),buttonText:asL(b.buttonText)};
    return b;
  };
  const blockDefaults={
    paragraph:()=>({id:mkId(),type:"paragraph",text:{en:"",am:""}}),
    heading:()=>({id:mkId(),type:"heading",level:2,text:{en:"",am:""}}),
    quote:()=>({id:mkId(),type:"quote",text:{en:"",am:""},attribution:{en:"",am:""}}),
    list:()=>({id:mkId(),type:"list",style:"bullet",items:[{en:"",am:""}]}),
    image:()=>({id:mkId(),type:"image",url:"",caption:{en:"",am:""},layout:"default"}),
    gallery:()=>({id:mkId(),type:"gallery",images:[{url:"",caption:{en:"",am:""}}]}),
    columns:()=>({id:mkId(),type:"columns",images:[{url:"",caption:{en:"",am:""}},{url:"",caption:{en:"",am:""}}]}),
    cta:()=>({id:mkId(),type:"cta",text:{en:"",am:""},buttonText:{en:"Learn more",am:""},buttonLink:"/"}),
    divider:()=>({id:mkId(),type:"divider"})
  };
  const blockTypes=[
    {key:"paragraph",label:"Paragraph"},
    {key:"heading",label:"Heading"},
    {key:"quote",label:"Quote"},
    {key:"list",label:"List"},
    {key:"image",label:"Image"},
    {key:"gallery",label:"Gallery"},
    {key:"columns",label:"Side-by-side images"},
    {key:"cta",label:"Call to action"},
    {key:"divider",label:"Divider"}
  ];
  const [posts,setPosts]=x.useState([]);
  const [loading,setLoading]=x.useState(!0);
  const [creating,setCreating]=x.useState(!1);
  const [newPost,setNewPost]=x.useState({title:"",author:"Senay Tela"});
  const [editId,setEditId]=x.useState(null);
  const [tab,setTab]=x.useState("details");
  const [draft,setDraft]=x.useState(null);
  const [saving,setSaving]=x.useState(!1);
  x.useEffect(()=>{Ws.blog.list().then(setPosts).finally(()=>setLoading(!1))},[]);
  const openEdit=post=>{
    const titleI18n=asL(post.titleI18n||post.title);
    const excerptI18n=asL(post.excerptI18n||post.excerpt);
    const seoTitleI18n=asL(post.seoTitleI18n||post.seoTitle);
    const seoDescriptionI18n=asL(post.seoDescriptionI18n||post.seoDescription);
    const blocks=Array.isArray(post.blocks)&&post.blocks.length?post.blocks.map(normalizeBlock):[blockDefaults.paragraph()];
    setEditId(post.id);
    setDraft({
      ...post,
      title:titleI18n.en||post.title||"",
      titleI18n,
      excerpt:excerptI18n.en||post.excerpt||"",
      excerptI18n,
      blocks,
      tags:post.tags||[],
      publishedAt:post.publishedAt?new Date(post.publishedAt).toISOString().slice(0,10):"",
      seoTitle:seoTitleI18n.en||post.seoTitle||"",
      seoTitleI18n,
      seoDescription:seoDescriptionI18n.en||post.seoDescription||"",
      seoDescriptionI18n
    });
    setTab("details");
  };
  const moveBlock=(idx,dir)=>setDraft(d=>{const blocks=[...d.blocks];const next=idx+dir;if(next<0||next>=blocks.length)return d;const [item]=blocks.splice(idx,1);blocks.splice(next,0,item);return{...d,blocks}});
  const updateBlock=(idx,patch)=>setDraft(d=>({...d,blocks:d.blocks.map((b,n)=>n===idx?{...b,...patch}:b)}));
  const removeBlock=idx=>setDraft(d=>({...d,blocks:d.blocks.filter((_,n)=>n!==idx)}));
  const addBlock=type=>setDraft(d=>({...d,blocks:[...d.blocks,blockDefaults[type]()]}));
  const createPost=async()=>{
    const title=newPost.title.trim();
    if(!title){we.error("Post title is required");return}
    const slug=title.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
    setCreating(!0);
    try{
      const post=await Ws.blog.create({
        slug,
        title,
        titleI18n:{en:title,am:""},
        excerpt:"",
        excerptI18n:{en:"",am:""},
        content:[""],
        blocks:[{id:mkId(),type:"paragraph",text:{en:"",am:""}}],
        author:newPost.author.trim()||"Senay Tela",
        publishedAt:new Date().toISOString(),
        readTime:"5 min",
        tags:[],
        published:!1
      });
      setPosts(p=>[post,...p]);
      setNewPost({title:"",author:"Senay Tela"});
      openEdit(post);
    }finally{setCreating(!1)}
  };
  const savePost=async()=>{
    if(!draft)return;
    setSaving(!0);
    try{
      const titleI18n=asL(draft.titleI18n);
      const excerptI18n=asL(draft.excerptI18n);
      const seoTitleI18n=asL(draft.seoTitleI18n);
      const seoDescriptionI18n=asL(draft.seoDescriptionI18n);
      const payload={
        slug:draft.slug,
        title:titleI18n.en||draft.title||"",
        titleI18n,
        excerpt:excerptI18n.en||draft.excerpt||"",
        excerptI18n,
        blocks:draft.blocks,
        image:draft.image,
        author:draft.author,
        publishedAt:draft.publishedAt?new Date(draft.publishedAt).toISOString():undefined,
        readTime:draft.readTime,
        tags:typeof draft.tags==="string"?draft.tags.split(",").map(t=>t.trim()).filter(Boolean):draft.tags||[],
        seoTitle:seoTitleI18n.en||draft.seoTitle||null,
        seoTitleI18n,
        seoDescription:seoDescriptionI18n.en||draft.seoDescription||null,
        seoDescriptionI18n,
        published:!!draft.published
      };
      const saved=await Ws.blog.update(draft.id,payload);
      setPosts(p=>p.map(item=>item.id===saved.id?saved:item));
      openEdit(saved);
      we.success("Article saved");
    }finally{setSaving(!1)}
  };
  const deletePost=async id=>{
    if(!(await adminConfirm({title:"Delete article?",description:"This blog post will be permanently removed.",confirmLabel:"Delete article"})))return;
    await Ws.blog.delete(id);
    setPosts(p=>p.filter(item=>item.id!==id));
    if(editId===id){setEditId(null);setDraft(null)}
    we.success("Deleted");
  };
  const renderBlock=(block,idx)=>{
    const controls=i.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[
      i.jsx(re,{size:"sm",variant:"outline",disabled:idx===0,onClick:()=>moveBlock(idx,-1),children:"Up"}),
      i.jsx(re,{size:"sm",variant:"outline",disabled:idx===draft.blocks.length-1,onClick:()=>moveBlock(idx,1),children:"Down"}),
      i.jsx(re,{size:"sm",variant:"ghost",onClick:()=>removeBlock(idx),children:i.jsx(Zt,{className:"w-4 h-4 text-destructive"})})
    ]});
    if(block.type==="paragraph")return i.jsxs(Ke,{className:"p-4 space-y-3",children:[
      i.jsxs("div",{className:"flex items-center justify-between",children:[i.jsx(me,{children:"Paragraph"}),controls]}),
      i.jsx(LField,{value:block.text,rows:4,onChange:text=>updateBlock(idx,{text})})
    ]},block.id);
    if(block.type==="heading")return i.jsxs(Ke,{className:"p-4 space-y-3",children:[
      i.jsxs("div",{className:"flex items-center justify-between",children:[i.jsx(me,{children:"Heading"}),controls]}),
      i.jsxs(Tt,{value:String(block.level||2),onValueChange:v=>updateBlock(idx,{level:Number(v)}),children:[i.jsx(_t,{children:i.jsx(Rt,{})}),i.jsxs(kt,{children:[i.jsx(ke,{value:"2",children:"H2"}),i.jsx(ke,{value:"3",children:"H3"})]})]}),
      i.jsx(LField,{value:block.text,onChange:text=>updateBlock(idx,{text})})
    ]},block.id);
    if(block.type==="quote")return i.jsxs(Ke,{className:"p-4 space-y-3",children:[
      i.jsxs("div",{className:"flex items-center justify-between",children:[i.jsx(me,{children:"Quote"}),controls]}),
      i.jsx(LField,{label:"quote",value:block.text,rows:3,onChange:text=>updateBlock(idx,{text})}),
      i.jsx(LField,{label:"attribution",value:block.attribution,onChange:attribution=>updateBlock(idx,{attribution})})
    ]},block.id);
    if(block.type==="list")return i.jsxs(Ke,{className:"p-4 space-y-3",children:[
      i.jsxs("div",{className:"flex items-center justify-between",children:[i.jsx(me,{children:"List"}),controls]}),
      i.jsxs(Tt,{value:block.style||"bullet",onValueChange:v=>updateBlock(idx,{style:v}),children:[i.jsx(_t,{children:i.jsx(Rt,{})}),i.jsxs(kt,{children:[i.jsx(ke,{value:"bullet",children:"Bullets"}),i.jsx(ke,{value:"numbered",children:"Numbered"})]})]}),
      ...(block.items||[]).map((item,itemIdx)=>i.jsxs("div",{className:"space-y-2 rounded-lg border p-3",children:[
        i.jsx(LField,{label:`item ${itemIdx+1}`,value:item,onChange:next=>updateBlock(idx,{items:block.items.map((v,n)=>n===itemIdx?next:v)})}),
        i.jsx(re,{size:"sm",variant:"ghost",onClick:()=>updateBlock(idx,{items:block.items.filter((_,n)=>n!==itemIdx)}),children:"Remove item"})
      ]},`${block.id}-${itemIdx}`)),
      i.jsx(re,{size:"sm",variant:"outline",onClick:()=>updateBlock(idx,{items:[...(block.items||[]),{en:"",am:""}]}),children:"+ Add item"})
    ]},block.id);
    if(block.type==="image")return i.jsxs(Ke,{className:"p-4 space-y-3",children:[
      i.jsxs("div",{className:"flex items-center justify-between",children:[i.jsx(me,{children:"Image"}),controls]}),
      i.jsx(Fn,{label:"",value:block.url||"",onChange:url=>updateBlock(idx,{url:url||""}),aspect:"wide"}),
      i.jsx(LField,{label:"caption",value:block.caption,onChange:caption=>updateBlock(idx,{caption})}),
      i.jsxs(Tt,{value:block.layout||"default",onValueChange:v=>updateBlock(idx,{layout:v}),children:[i.jsx(_t,{children:i.jsx(Rt,{})}),i.jsxs(kt,{children:[i.jsx(ke,{value:"default",children:"Default"}),i.jsx(ke,{value:"wide",children:"Wide"}),i.jsx(ke,{value:"full",children:"Full width"})]})]})
    ]},block.id);
    if(block.type==="gallery"||block.type==="columns")return i.jsxs(Ke,{className:"p-4 space-y-3",children:[
      i.jsxs("div",{className:"flex items-center justify-between",children:[i.jsx(me,{children:block.type==="gallery"?"Gallery":"Side-by-side images"}),controls]}),
      ...(block.images||[]).map((img,imgIdx)=>i.jsxs("div",{className:"grid grid-cols-1 gap-3 rounded-lg border p-3",children:[
        i.jsx(Fn,{label:`Image ${imgIdx+1}`,value:img.url||"",onChange:url=>updateBlock(idx,{images:block.images.map((v,n)=>n===imgIdx?{...v,url:url||""}:v)}),aspect:"wide"}),
        i.jsx(LField,{label:"caption",value:img.caption,onChange:caption=>updateBlock(idx,{images:block.images.map((v,n)=>n===imgIdx?{...v,caption}:v)})})
      ]},`${block.id}-img-${imgIdx}`)),
      i.jsx(re,{size:"sm",variant:"outline",onClick:()=>updateBlock(idx,{images:[...(block.images||[]),{url:"",caption:{en:"",am:""}}]}),children:"+ Add image"})
    ]},block.id);
    if(block.type==="cta")return i.jsxs(Ke,{className:"p-4 space-y-3",children:[
      i.jsxs("div",{className:"flex items-center justify-between",children:[i.jsx(me,{children:"Call to action"}),controls]}),
      i.jsx(LField,{label:"text",value:block.text,rows:2,onChange:text=>updateBlock(idx,{text})}),
      i.jsx(LField,{label:"button text",value:block.buttonText,onChange:buttonText=>updateBlock(idx,{buttonText})}),
      i.jsx(J,{placeholder:"Button link (shared)",value:block.buttonLink||"",onChange:e=>updateBlock(idx,{buttonLink:e.target.value})})
    ]},block.id);
    return i.jsxs(Ke,{className:"p-4",children:[
      i.jsxs("div",{className:"flex items-center justify-between",children:[i.jsx(me,{children:"Divider"}),controls]}),
      i.jsx("div",{className:"h-px bg-border"})
    ]},block.id);
  };
  if(loading)return i.jsx(ht,{className:"h-96"});
  if(editId&&draft)return i.jsxs("div",{className:"space-y-6 animate-fade-in",children:[
    i.jsxs("div",{className:"flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",children:[
      i.jsxs("div",{children:[
        i.jsx(re,{variant:"outline",size:"sm",onClick:()=>{setEditId(null);setDraft(null)},children:"← All articles"}),
        i.jsx("h1",{className:"font-display text-3xl font-bold text-burgundy mt-3",children:"Edit article"}),
        i.jsx("p",{className:"text-brown-muted",children:asL(draft.titleI18n).en||draft.title}),
        i.jsx("p",{className:"text-xs text-brown-muted mt-1",children:"One article · English + Amharic fields on each text block"})
      ]}),
      i.jsxs("div",{className:"flex gap-2",children:[
        i.jsxs(re,{variant:"destructive",onClick:()=>deletePost(draft.id),children:[i.jsx(Zt,{className:"w-4 h-4 mr-2"}),"Delete"]}),
        i.jsxs(re,{onClick:savePost,disabled:saving,children:[i.jsx(ha,{className:"w-4 h-4 mr-2"}),saving?"Saving...":"Save article"]})
      ]})
    ]}),
    i.jsx("div",{className:"flex flex-wrap gap-2",children:[["details","Details"],["content","Content"],["seo","SEO"]].map(([key,label])=>i.jsx(re,{size:"sm",variant:tab===key?"default":"outline",onClick:()=>setTab(key),children:label},key))}),
    tab==="details"?i.jsxs(Ke,{className:"p-4 space-y-4",children:[
      i.jsx(LField,{label:"title",value:draft.titleI18n,onChange:titleI18n=>setDraft(d=>({...d,titleI18n,title:asL(titleI18n).en}))}),
      i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Slug (shared URL)"}),i.jsx(J,{value:draft.slug||"",onChange:e=>setDraft(d=>({...d,slug:e.target.value}))})]}),
      i.jsx(LField,{label:"short description",value:draft.excerptI18n,rows:3,onChange:excerptI18n=>setDraft(d=>({...d,excerptI18n,excerpt:asL(excerptI18n).en}))}),
      i.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Author (shared)"}),i.jsx(J,{value:draft.author||"",onChange:e=>setDraft(d=>({...d,author:e.target.value}))})]}),
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Read time (shared)"}),i.jsx(J,{value:draft.readTime||"",placeholder:"5 min",onChange:e=>setDraft(d=>({...d,readTime:e.target.value}))})]}),
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Publish date (shared)"}),i.jsx(J,{type:"date",value:draft.publishedAt||"",onChange:e=>setDraft(d=>({...d,publishedAt:e.target.value}))})]}),
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Tags (shared, comma separated)"}),i.jsx(J,{value:Array.isArray(draft.tags)?draft.tags.join(", "):draft.tags||"",onChange:e=>setDraft(d=>({...d,tags:e.target.value}))})]})
      ]}),
      i.jsxs("div",{className:"flex items-center gap-2",children:[i.jsx(rn,{checked:!!draft.published,onCheckedChange:v=>setDraft(d=>({...d,published:v}))}),i.jsx(me,{className:"mb-0",children:"Published"})]}),
      i.jsx(Fn,{label:"Featured / hero image (shared)",value:draft.image||"",onChange:url=>setDraft(d=>({...d,image:url||""})),aspect:"wide"})
    ]}):null,
    tab==="content"?i.jsxs("div",{className:"space-y-4",children:[
      i.jsxs("div",{className:"flex flex-wrap gap-2",children:blockTypes.map(t=>i.jsx(re,{size:"sm",variant:"outline",onClick:()=>addBlock(t.key),children:`+ ${t.label}`},t.key))}),
      draft.blocks.map((block,idx)=>renderBlock(block,idx))
    ]}):null,
    tab==="seo"?i.jsxs(Ke,{className:"p-4 space-y-4",children:[
      i.jsx(LField,{label:"SEO title",value:draft.seoTitleI18n,onChange:seoTitleI18n=>setDraft(d=>({...d,seoTitleI18n,seoTitle:asL(seoTitleI18n).en}))}),
      i.jsx(LField,{label:"SEO description",value:draft.seoDescriptionI18n,rows:4,onChange:seoDescriptionI18n=>setDraft(d=>({...d,seoDescriptionI18n,seoDescription:asL(seoDescriptionI18n).en}))})
    ]}):null
  ]});
  return i.jsxs("div",{className:"space-y-6 animate-fade-in",children:[
    i.jsxs("div",{className:"flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",children:[
      i.jsxs("div",{children:[
        i.jsx("h1",{className:"font-display text-3xl font-bold text-burgundy",children:"Blog"}),
        i.jsx("p",{className:"text-brown-muted",children:"One post per article — English and Amharic live in the same editor."})
      ]}),
      i.jsxs("div",{className:"flex flex-wrap gap-2 items-end",children:[
        i.jsx(J,{placeholder:"New article title",value:newPost.title,onChange:e=>setNewPost(p=>({...p,title:e.target.value})),className:"min-w-[220px]"}),
        i.jsx(J,{placeholder:"Author",value:newPost.author,onChange:e=>setNewPost(p=>({...p,author:e.target.value})),className:"w-40"}),
        i.jsxs(re,{onClick:createPost,disabled:creating,children:[i.jsx(Qt,{className:"w-4 h-4 mr-2"}),creating?"Creating...":"New article"]})
      ]})
    ]}),
    i.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:posts.map(post=>i.jsx(Ke,{className:"p-4",children:i.jsxs("div",{className:"space-y-3",children:[
      post.image?i.jsx("img",{src:post.image,alt:"",className:"h-36 w-full rounded-xl object-cover"}):null,
      i.jsxs("div",{children:[
        i.jsx("p",{className:"font-display text-lg font-bold text-burgundy",children:post.title}),
        i.jsx("p",{className:"text-sm text-brown-muted line-clamp-2",children:post.excerpt||"No description yet."})
      ]}),
      i.jsxs("div",{className:"flex items-center justify-between text-xs text-brown-muted",children:[
        i.jsx("span",{children:post.published?"Published":"Draft"}),
        i.jsx("span",{children:post.readTime})
      ]}),
      i.jsx(re,{size:"sm",onClick:()=>openEdit(post),children:"Edit article"})
    ]})},post.id))})
  ]});
}
