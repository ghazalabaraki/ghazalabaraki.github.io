var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{threshold:.12,rootMargin:'0px 0px -50px 0px'});
document.querySelectorAll('.rv').forEach(function(el,i){el.style.transitionDelay=(i%3*60)+'ms';io.observe(el);});

document.querySelectorAll('.rn[data-to]').forEach(function(el){
  var o=new IntersectionObserver(function(es){es.forEach(function(e){
    if(!e.isIntersecting)return;
    var to=+el.dataset.to,post=el.dataset.post||'';
    if(reduce){el.textContent=to+post;o.unobserve(el);return;}
    var cur=0,st=Math.max(1,Math.round(to/30));
    var t=setInterval(function(){cur=Math.min(to,cur+st);el.textContent=cur+post;if(cur>=to)clearInterval(t)},28);
    o.unobserve(el);
  })},{threshold:.5});
  o.observe(el);
});

(function(){
  if(reduce||window.matchMedia('(hover:none)').matches)return;
  var ring=document.getElementById('cur'),dot=document.getElementById('curdot');
  if(!ring||!dot)return;
  var mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
  addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;dot.style.transform='translate('+(mx-3)+'px,'+(my-3)+'px)';});
  (function loop(){rx+=(mx-rx)*.14;ry+=(my-ry)*.14;ring.style.transform='translate('+(rx-17)+'px,'+(ry-17)+'px)';requestAnimationFrame(loop);})();
  document.querySelectorAll('a,button').forEach(function(el){
    el.addEventListener('mouseenter',function(){ring.classList.add('big')});
    el.addEventListener('mouseleave',function(){ring.classList.remove('big')});
  });
})();
