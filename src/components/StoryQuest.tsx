import {useState} from 'react';
import {CHAPTERS, type Campaign} from '../game/campaign';
const stories={
 cognitive:{title:'The painted cave',prompt:'Two unfamiliar bands arrive at the same shelter. What might help them work together?',choices:['Invent a shared symbol and a story','Assume everyone already trusts everyone'],answer:0,fact:'Sapiens explores how shared stories can help strangers cooperate. This is a book-inspired interpretation, not a claim that every society followed one path.',task:'Take this idea into the council: decide how your band should cooperate.'},
 agricultural:{title:'The whispering wheat',prompt:'Your band plants a larger field. Does more food necessarily make every individual’s life easier?',choices:['Yes, a larger harvest guarantees happiness','No, cultivation can introduce new work and dependencies'],answer:1,fact:'Harari presents farming as a trade-off: growing collective capacity could coexist with harder lives for individuals. Outcomes differed across societies.',task:'Gather supplies and open Research to explore cultivation.'},
 scientific:{title:'The stargazer’s question',prompt:'A familiar explanation does not match what you observe in the sky. What do you do?',choices:['Record observations and test a new explanation','Ignore observations that disagree'],answer:0,fact:'This chapter explores the book’s theme of learning through acknowledged uncertainty. The observatory and its choices are fictional teaching scenarios.',task:'Bring your observation to the council and investigate scientific method.'}
};
export function StoryQuest({s,onDiscover,onGo}:{s:Campaign;onDiscover:()=>void;onGo:(menu:string)=>void}){
 const [answer,setAnswer]=useState<number|null>(null);const story=stories[s.era];
 const complete=s.insightIds.includes(s.era);const revealed=answer!==null||complete;
 return <section className="story-quest"><span className="eyebrow">Story quest · {CHAPTERS[s.era].title}</span><h3>{story.title}</h3><p>{story.prompt}</p>
 {!complete&&story.choices.map((text,i)=><button key={text} onClick={()=>setAnswer(i)} aria-pressed={answer===i}>{text}</button>)}
 {revealed&&<div role="status"><strong>{complete?'Insight collected':answer===story.answer?'A thoughtful choice.':'Consider another consequence.'}</strong><p>{story.fact}</p><p>{story.task}</p>{!complete&&answer===story.answer&&<button onClick={onDiscover}>Collect insight · +12 knowledge</button>}</div>}
 <p><a href="https://www.ynharari.com/book/sapiens/" target="_blank" rel="noreferrer">Inspired by Sapiens · author’s book overview</a></p>
 <button onClick={()=>onGo(s.era==='agricultural'?'research':'council')}>Continue this quest →</button></section>;
}
