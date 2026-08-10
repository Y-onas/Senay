function h6(){
  const defaults={
    eyebrow:"Contact",
    title:"We'd love to hear from you",
    description:"Questions, reservations or feedback — reach out and our team will get back to you.",
    formTitle:"Send a message",
    phone:"+251 91 234 5678",
    email:"hello@senaytela.com",
    hoursTitle:"Opening Hours",
    contactTitle:"Get in touch",
    openingHours:[
      {day:"Monday – Thursday",hours:"11:00 AM – 10:00 PM"},
      {day:"Friday – Saturday",hours:"11:00 AM – 12:00 AM"},
      {day:"Sunday",hours:"12:00 PM – 9:00 PM"}
    ],
    locationsTitle:"Locations",
    locationsDescription:"Visit any of our three Addis Ababa branches for authentic Ethiopian food and house-brewed drinks.",
    locationsButtonText:"Explore all locations",
    branches:[
      {id:"lebu",name:"Lebu Muzika Sefer",area:"Lebu · Addis Ababa",mapUrl:"https://www.google.com/maps/search/?api=1&query=Lebu+Muzika+Sefer+Addis+Ababa",image:""},
      {id:"figa",name:"Figa Mebrat Summit Road",area:"Summit · Addis Ababa",mapUrl:"https://www.google.com/maps/search/?api=1&query=Figa+Mebrat+Summit+Road+Addis+Ababa",image:""},
      {id:"jemo",name:"Jemo 1 Condominium",area:"Jemo · Addis Ababa",mapUrl:"https://www.google.com/maps/search/?api=1&query=Jemo+1+Condominium+Addis+Ababa",image:""}
    ]
  };
  const [draft,setDraft]=x.useState(defaults);
  const [loading,setLoading]=x.useState(!0);
  const [saving,setSaving]=x.useState(!1);
  x.useEffect(()=>{
    Ws.settings.get("page:contact").then(data=>{
      const d=data||{};
      setDraft({
        eyebrow:d.eyebrow||defaults.eyebrow,
        title:d.title||defaults.title,
        description:d.description||defaults.description,
        formTitle:d.formTitle||defaults.formTitle,
        phone:d.phone||defaults.phone,
        email:d.email||defaults.email,
        hoursTitle:d.hoursTitle||defaults.hoursTitle,
        contactTitle:d.contactTitle||defaults.contactTitle,
        openingHours:Array.isArray(d.openingHours)&&d.openingHours.length?d.openingHours:defaults.openingHours,
        locationsTitle:d.locationsTitle||defaults.locationsTitle,
        locationsDescription:d.locationsDescription||defaults.locationsDescription,
        locationsButtonText:d.locationsButtonText||defaults.locationsButtonText,
        branches:Array.isArray(d.branches)&&d.branches.length?d.branches:defaults.branches
      });
    }).finally(()=>setLoading(!1));
  },[]);
  const setHour=(idx,field,value)=>{
    setDraft(d=>{
      const openingHours=[...d.openingHours];
      openingHours[idx]={...openingHours[idx],[field]:value};
      return {...d,openingHours};
    });
  };
  const setBranch=(idx,field,value)=>{
    setDraft(d=>{
      const branches=[...d.branches];
      branches[idx]={...branches[idx],[field]:value};
      return {...d,branches};
    });
  };
  const save=async()=>{
    setSaving(!0);
    try{
      const payload={
        eyebrow:draft.eyebrow.trim(),
        title:draft.title.trim(),
        description:draft.description.trim(),
        formTitle:draft.formTitle.trim(),
        phone:draft.phone.trim(),
        email:draft.email.trim(),
        hoursTitle:draft.hoursTitle.trim(),
        contactTitle:draft.contactTitle.trim(),
        openingHours:draft.openingHours.filter(h=>h.day.trim()||h.hours.trim()).map(h=>({day:h.day.trim(),hours:h.hours.trim()})),
        locationsTitle:draft.locationsTitle.trim(),
        locationsDescription:draft.locationsDescription.trim(),
        locationsButtonText:draft.locationsButtonText.trim(),
        branches:draft.branches.filter(b=>b.name.trim()||b.area.trim()).map((b,idx)=>({id:b.id||("branch-"+(idx+1)),name:b.name.trim(),area:b.area.trim(),mapUrl:b.mapUrl.trim(),image:b.image||""}))
      };
      await Ws.settings.update("page:contact",payload);
      const restaurant=await Ws.settings.get("restaurant").catch(()=>({}));
      await Ws.settings.update("restaurant",{...restaurant,phone:payload.phone,email:payload.email,openingHours:payload.openingHours});
      setDraft(payload);
      we.success("Contact page saved");
    }finally{setSaving(!1)}
  };
  if(loading)return i.jsx(ht,{className:"h-96"});
  return i.jsxs("div",{className:"space-y-6 animate-fade-in",children:[
    i.jsxs("div",{className:"flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",children:[
      i.jsxs("div",{children:[
        i.jsx("h1",{className:"font-display text-3xl font-bold text-burgundy",children:"Contact Us"}),
        i.jsx("p",{className:"text-brown-muted",children:"Edit the contact page hero, hours, phone, email and branch locations."})
      ]}),
      i.jsxs(re,{onClick:save,disabled:saving,children:[i.jsx(ha,{className:"w-4 h-4 mr-2"}),saving?"Saving...":"Save contact page"]})
    ]}),
    i.jsx(Ke,{className:"border-yellow-brand/30 bg-yellow-brand/5 p-4",children:i.jsxs("p",{className:"text-sm text-brown-muted",children:["Messages from the contact form appear in ",i.jsx(ci,{to:"/contact-messages",className:"font-semibold text-burgundy underline",children:"Contact Messages"}),"."]})}),
    i.jsxs(Ke,{children:[
      i.jsx(Ot,{children:i.jsx(Mt,{children:"Page heading"})}),
      i.jsxs(xt,{className:"space-y-4",children:[
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Eyebrow"}),i.jsx(J,{value:draft.eyebrow,onChange:e=>setDraft(d=>({...d,eyebrow:e.target.value}))})]}),
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Title"}),i.jsx(J,{value:draft.title,onChange:e=>setDraft(d=>({...d,title:e.target.value}))})]}),
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Description"}),i.jsx(Vn,{value:draft.description,onChange:e=>setDraft(d=>({...d,description:e.target.value})),rows:3})]}),
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Form title"}),i.jsx(J,{value:draft.formTitle,onChange:e=>setDraft(d=>({...d,formTitle:e.target.value}))})]})
      ]})
    ]}),
    i.jsxs(Ke,{children:[
      i.jsx(Ot,{children:i.jsx(Mt,{children:"Opening hours"})}),
      i.jsxs(xt,{className:"space-y-3",children:[
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Section title"}),i.jsx(J,{value:draft.hoursTitle,onChange:e=>setDraft(d=>({...d,hoursTitle:e.target.value}))})]}),
        draft.openingHours.map((row,idx)=>i.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end",children:[
          i.jsx(J,{value:row.day,placeholder:"Day label",onChange:e=>setHour(idx,"day",e.target.value)}),
          i.jsx(J,{value:row.hours,placeholder:"Hours",onChange:e=>setHour(idx,"hours",e.target.value)}),
          i.jsx(re,{size:"sm",variant:"ghost",onClick:()=>setDraft(d=>({...d,openingHours:d.openingHours.filter((_,j)=>j!==idx)})),children:i.jsx(Zt,{className:"w-4 h-4 text-destructive"})})
        ]},idx)),
        i.jsx(re,{size:"sm",variant:"outline",onClick:()=>setDraft(d=>({...d,openingHours:[...d.openingHours,{day:"",hours:""}]})),children:"+ Add hours row"})
      ]})
    ]}),
    i.jsxs(Ke,{children:[
      i.jsx(Ot,{children:i.jsx(Mt,{children:"Get in touch"})}),
      i.jsxs(xt,{className:"space-y-4",children:[
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Section title"}),i.jsx(J,{value:draft.contactTitle,onChange:e=>setDraft(d=>({...d,contactTitle:e.target.value}))})]}),
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Phone"}),i.jsx(J,{value:draft.phone,onChange:e=>setDraft(d=>({...d,phone:e.target.value}))})]}),
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Email"}),i.jsx(J,{value:draft.email,onChange:e=>setDraft(d=>({...d,email:e.target.value}))})]})
      ]})
    ]}),
    i.jsxs(Ke,{children:[
      i.jsx(Ot,{children:i.jsx(Mt,{children:"Locations section"})}),
      i.jsxs(xt,{className:"space-y-4",children:[
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Section title"}),i.jsx(J,{value:draft.locationsTitle,onChange:e=>setDraft(d=>({...d,locationsTitle:e.target.value}))})]}),
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Description"}),i.jsx(Vn,{value:draft.locationsDescription,onChange:e=>setDraft(d=>({...d,locationsDescription:e.target.value})),rows:3})]}),
        i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Button text"}),i.jsx(J,{value:draft.locationsButtonText,onChange:e=>setDraft(d=>({...d,locationsButtonText:e.target.value}))})]})
      ]})
    ]}),
    i.jsxs(Ke,{children:[
      i.jsx(Ot,{children:i.jsx(Mt,{children:"Branches"})}),
      i.jsxs(xt,{className:"space-y-4",children:[
        draft.branches.map((branch,idx)=>i.jsxs("div",{className:"rounded-xl border p-4 space-y-3",children:[
          i.jsxs("div",{className:"flex items-center justify-between",children:[
            i.jsxs(me,{children:["Branch ",idx+1]}),
            i.jsx(re,{size:"sm",variant:"ghost",onClick:()=>setDraft(d=>({...d,branches:d.branches.filter((_,j)=>j!==idx)})),children:i.jsx(Zt,{className:"w-4 h-4 text-destructive"})})
          ]}),
          i.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3",children:[
            i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Name"}),i.jsx(J,{value:branch.name||"",onChange:e=>setBranch(idx,"name",e.target.value)})]}),
            i.jsxs("div",{className:"space-y-2",children:[i.jsx(me,{children:"Area label"}),i.jsx(J,{value:branch.area||"",onChange:e=>setBranch(idx,"area",e.target.value)})]}),
            i.jsxs("div",{className:"space-y-2 md:col-span-2",children:[i.jsx(me,{children:"Google Maps link"}),i.jsx(J,{value:branch.mapUrl||"",onChange:e=>setBranch(idx,"mapUrl",e.target.value)})]})
          ]}),
          i.jsx(Fn,{label:"Branch photo (optional)",value:branch.image||"",onChange:url=>setBranch(idx,"image",url||""),aspect:"wide"})
        ]},branch.id||idx)),
        i.jsx(re,{size:"sm",variant:"outline",onClick:()=>setDraft(d=>({...d,branches:[...d.branches,{id:"branch-"+Date.now(),name:"",area:"",mapUrl:"",image:""}]})),children:"+ Add branch"})
      ]})
    ]})
  ]});
}
