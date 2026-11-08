// Learning stays manually hidden. Free reading can reveal recognized words.
export function wordHidden(hidden, ayah, revealedAyahs=[],status='waiting',revealRecognized=false){
 return Boolean(hidden)&&!revealedAyahs.includes(ayah)&&!(revealRecognized&&(status==='heard'||status==='check'));
}

// Ink bounds vary with Arabic diacritics. Use the line's centre and a single
// page-wide height so neighbouring feedback blocks share their edges.
export function wordBand(page, word){
 const line=page.lines[word.lineIndex]||page.lines.find(l=>l.lineNumber===word.line);
 const spacing=page.lineSpacing||30,height=spacing*.78;
 const centre=line?.centre??((word.y0+word.y1)/2);
 return {x:word.x0,y:centre-height/2,width:Math.max(2,word.x1-word.x0),height};
}
