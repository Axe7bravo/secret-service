import { useLayoutEffect } from 'react'; import gsap from 'gsap'; import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
export function usePageAnimations(scope: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(()=>{
    if(!scope.current) return;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){gsap.set(scope.current.querySelectorAll('.hero-telemetry,.hero-title,.hero-subtitle,.hero .btn'),{opacity:1,clearProps:'transform'});return;}
    const ctx=gsap.context(()=>{
      const telemetry=scope.current!.querySelector('.hero-telemetry'); const title=scope.current!.querySelector('.hero-title'); const subtitle=scope.current!.querySelector('.hero-subtitle'); const button=scope.current!.querySelector('.hero .btn');
      if(title){const tl=gsap.timeline({defaults:{ease:'power3.out'}}); if(telemetry)tl.to(telemetry,{opacity:1,duration:.6,y:0},.2); tl.fromTo(title,{opacity:0,y:40},{opacity:1,y:0,duration:1},.4); if(subtitle)tl.fromTo(subtitle,{opacity:0,y:20},{opacity:1,y:0,duration:.8},.8); if(button)tl.fromTo(button,{opacity:0,y:20},{opacity:1,y:0,duration:.6},1.1);}
      const reveal=(selector:string,vars:gsap.TweenVars)=>gsap.utils.toArray<HTMLElement>(selector,scope.current).forEach((el,i,all)=>gsap.from(el,{scrollTrigger:{trigger:el,start:'top 85%'},opacity:0,y:40,duration:.8,...vars,delay:typeof vars.delay==='function'?vars.delay(i,el,all):vars.delay}));
      reveal('.timeline-step',{y:50,delay:(i:number)=>i*.15}); reveal('.classified-card',{y:60,duration:.7,delay:(i:number)=>i*.1}); reveal('.section-header',{y:30}); reveal('.spec-item',{duration:.7,delay:(i:number)=>i*.15});
      gsap.utils.toArray<HTMLElement>('.protocol-panel-content',scope.current).forEach(panel=>gsap.from(panel.children,{scrollTrigger:{trigger:panel,start:'top 75%'},opacity:0,y:40,duration:.8,stagger:.15}));
      const editorial=scope.current!.querySelector('.editorial-text'); if(editorial)gsap.from(editorial.children,{scrollTrigger:{trigger:editorial,start:'top 80%'},opacity:0,y:30,duration:.7,stagger:.12});
      const visual=scope.current!.querySelector('.editorial-visual'); if(visual)gsap.from(visual,{scrollTrigger:{trigger:visual,start:'top 80%'},opacity:0,x:60,duration:1});
      const terminal=scope.current!.querySelector('.terminal-container'); if(terminal)gsap.from(terminal,{scrollTrigger:{trigger:terminal,start:'top 80%'},opacity:0,y:40,scale:.98,duration:.9});
    },scope);
    return()=>ctx.revert();
  },[scope]);
}
