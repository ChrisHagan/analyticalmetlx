function setupStatus(){pending={};var a=$("#strokesPending"),b=$("#latency"),e=0;window.progressFuncs={};var d={};window.updateStrokesPending=function(d,g){0<d?pending[g]=Date.now():g in pending&&(e=Date.now()-pending[g],delete pending[g]);a.text(Object.keys(pending).length);b.text(e)};window.registerTracker=function(a,b){b?progressFuncs[a]=b:console.log("No tracker provided against",a)};window.updateTracking=function(a){if(a in progressFuncs){var b=progressFuncs[a];delete progressFuncs[a];b()}else console.log("updateTracking problem: Nobody is listening for ",
a)};window.stopTracking=function(a){if(a in d)d[a]();delete progressFuncs[a];delete d[a]};window.trackerFrom=function(a){return _.filter(_.keys(progressFuncs),function(b){return _.endsWith(a,sprintf("_from:%s",b))})}}
function strokeCollected(a){if(0<a.length){for(var b=Conversations.getCurrentSlideJid(),b={thickness:scaleScreenToWorld(Modes.draw.drawingAttributes.width),color:[Modes.draw.drawingAttributes.color,255],type:"ink",author:UserSettings.getUsername(),timestamp:Date.now(),target:"presentationSpace",privacy:Privacy.getCurrentPrivacy(),slide:b.toString(),isHighlighter:Modes.draw.drawingAttributes.isHighlighter},e=[],d,f,g=0;g<a.length;g+=3)d=a[g],f=a[g+1],e=e.concat([d,f,a[g+2]]);b.points=e;b.checksum=
b.points.reduce(function(a,b){return a+b},0);b.startingSum=b.checksum;b.identity=b.checksum.toFixed(1);b.audiences=_.map(Conversations.getCurrentGroup(),"id").concat(ContentFilter.getAudiences()).map(audienceToStanza);calculateInkBounds(b);prerenderInk(b);b.isHighlighter?boardContent.highlighters[b.identity]=b:boardContent.inks[b.identity]=b;sendInk(b)}}
function batchTransform(){var a=Conversations.getCurrentSlideJid();return{type:"moveDelta",identity:Date.now().toString(),author:UserSettings.getUsername(),slide:a.toString(),target:"presentationSpace",privacy:Privacy.getCurrentPrivacy(),timestamp:Date.now(),inkIds:[],textIds:[],multiWordTextIds:[],videoIds:[],imageIds:[],xOrigin:0,yOrigin:0,xTranslate:0,yTranslate:0,xScale:1,yScale:1,isDeleted:!1,newPrivacy:"not_set"}}
function sendDirtyInk(a){var b=Conversations.getCurrentSlideJid();sendStanza({type:"dirtyInk",identity:a.identity,author:UserSettings.getUsername(),timestamp:Date.now(),slide:b.toString(),target:"presentationSpace",privacy:a.privacy})}function sendInk(a){updateStrokesPending(1,a.identity);sendStanza(a)}
function hexToRgb(a){return"object"==typeof a&&a.alpha?Colors.getColorForColorParts(a.alpha,a.red,a.green,a.blue):"object"==typeof a&&a[0]&&a[1]&&"string"==typeof a[0]&&"number"==typeof a[1]?a:"string"==typeof a?Colors.getColorObjForHex(a):"array"==typeof a?a:Colors.getDefaultColorObj()}function audienceToStanza(a){return{domain:"slide",type:"groupWork",action:"whitelist",name:a}}
function partToStanza(a){var b=carota.runs.defaultFormatting,e=hexToRgb(a.color||b.color);return{text:a.text,color:e,size:parseFloat(a.size)||parseFloat(b.size),font:a.font||b.font,justify:a.align||b.align,bold:!0===a.bold,underline:!0===a.underline,italic:!0===a.italic}}
function richTextEditorToStanza(a){a.bounds||a.doc.invalidateBounds();a.audiences=_.map(Conversations.getCurrentGroup(),"id").concat(ContentFilter.getAudiences());var b=a.bounds,e=a.doc.save();void 0==a.slide&&(a.slide=Conversations.getCurrentSlideJid());void 0==a.author&&(a.author=UserSettings.getUsername());void 0==a.target&&(a.target="presentationSpace");void 0==a.privacy&&(a.privacy=Privacy.getCurrentPrivacy());return{author:a.author,timestamp:-1,target:a.target,tag:"_",privacy:a.privacy,slide:a.slide,
identity:a.identity,type:a.type,x:b[0],y:b[1],requestedWidth:a.doc.width(),width:a.doc.width(),height:b[3]-b[1],words:e.map(partToStanza),audiences:a.audiences.map(audienceToStanza)}}function sendRichText(a){Modes.text.echoesToDisregard[a.identity]=!0;a=richTextEditorToStanza(a);sendStanza(a)}
var stanzaHandlers={ink:inkReceived,dirtyInk:dirtyInkReceived,move:moveReceived,moveDelta:transformReceived,image:imageReceived,video:videoReceived,text:textReceived,multiWordText:richTextReceived,command:commandReceived,submission:submissionReceived,attendance:attendanceReceived,file:fileReceived,theme:themeReceived};function themeReceived(a){boardContent.themes.push(a);Progress.call("themeReceived")}function fileReceived(a){}function attendanceReceived(a){}
function submissionReceived(a){Submissions.processSubmission(a)}
function commandReceived(a){if("/TEACHER_VIEW_MOVED"==a.command&&a.parameters[5]==Conversations.getCurrentSlide().id.toString()){var b=_.slice(a.parameters,0,6).map(parseFloat);if(_.some(b,isNaN))console.log("Can't follow teacher to",a);else if(b[4]!=DeviceConfiguration.getIdentity()&&Conversations.getIsSyncedToTeacher()){console.log("teacherViewMoved",a);var e=function(){var d=a.parameters[6];b[5]==Conversations.getCurrentSlide().id.toString()&&("true"==d?zoomToFit():(zoomToPage(),TweenController.zoomAndPanViewbox(b[0],
b[1],b[2],b[3],function(){},!1,!0)))};UserSettings.getIsInteractive()||e()}}}function richTextReceived(a){a.identity in Modes.text.echoesToDisregard||isUsable(a)&&WorkQueue.enqueue(function(){Modes.text.editorFor(a).doc.load(a.words);blit()})}
function textReceived(a){try{isUsable(a)?(boardContent.texts[a.identity]=a,prerenderText(a),incorporateBoardBounds(a.bounds),WorkQueue.enqueue(function(){return isInClearSpace(a.bounds)?(drawText(a),!1):!0})):a.identity in boardContent.texts&&delete boardContent.texts[a.identity]}catch(b){console.log("textReceived exception:",b)}}function receiveMeTLStanza(a){Progress.call("stanzaReceived",[a])}
function actOnReceivedStanza(a){try{a.type in stanzaHandlers?(stanzaHandlers[a.type](a),Progress.onBoardContentChanged.autoZooming&&measureBoardContent("multiWordText"==a.type),Progress.call("onBoardContentChanged")):console.log(sprintf("Unknown stanza: %s %s",a.type,a))}catch(b){console.log("Exception in receiveMeTLStanza",b,a)}}
function transformReceived(a){var b="",e=function(){var a=[void 0,void 0,void 0,void 0],c=function(){return a},b=function(c,b){void 0==c||isNaN(c)||(a[b]=c)};return{minX:c[0],setMinX:function(a){b(a,0)},minY:c[1],setMinY:function(a){b(a,1)},maxX:c[2],setMaxX:function(a){b(a,2)},maxY:c[3],setMaxY:function(a){b(a,3)},incorporateBounds:function(c){var b=function(b){var d=a[b];void 0==d||isNaN(d)?a[b]=c[b]:a[b]=Math.max(d,c[b])},d=function(b){var d=a[b];void 0==d||isNaN(d)?a[b]=c[b]:a[b]=Math.min(d,c[b])};
d(0);d(1);b(2);b(3)},getBounds:c,incorporateBoardBounds:function(){void 0!=a[0]&&void 0!=a[1]&&void 0!=a[2]&&void 0!=a[3]&&incorporateBoardBounds(a)}}}();if("not_set"!=a.newPrivacy&&!a.isDeleted){var d=a.newPrivacy,b=b+("Became "+d);$.each(a.inkIds,function(a,c){var b=boardContent.inks[c];b&&(b.privacy=d);if(b=boardContent.highlighters[c])b.privacy=d});$.each(a.imageIds,function(a,c){boardContent.images[c].privacy=d});$.each(a.videoIds,function(a,c){boardContent.videos[c].privacy=d});$.each(a.textIds,
function(a,c){boardContent.texts[c].privacy=d});$.each(a.multiWordTextIds,function(a,c){boardContent.multiWordTextIds[c].privacy=d})}a.isDeleted&&(b+="deleted",d=a.privacy,$.each(a.inkIds,function(a,c){deleteInk("highlighters",d,c);deleteInk("inks",d,c)}),$.each(a.imageIds,function(a,c){deleteImage(d,c)}),$.each(a.videoIds,function(a,c){deleteVideo(d,c)}),$.each(a.textIds,function(a,c){deleteText(d,c)}),$.each(a.multiWordTextIds,function(a,c){deleteMultiWordText(d,c)}));if(1!=a.xScale||1!=a.yScale){var b=
b+sprintf("scale (%s,%s)",a.xScale,a.yScale),f=[],g=[],h=[],m=[],n=[];$.each(a.inkIds,function(a,c){f.push(boardContent.inks[c]);f.push(boardContent.highlighters[c])});$.each(a.imageIds,function(a,c){m.push(boardContent.images[c])});$.each(a.videoIds,function(a,c){n.push(boardContent.videos[c])});$.each(a.textIds,function(a,c){g.push(boardContent.texts[c])});$.each(a.multiWordTextIds,function(a,c){c in Modes.text.echoesToDisregard||h.push(boardContent.multiWordTexts[c])});var k=0,l=0;if("xOrigin"in
a&&"yOrigin"in a)k=a.xOrigin,l=a.yOrigin;else{var r=!0,p=function(a){r?(k=a.x,l=a.y,r=!1):(a.x<k&&(k=a.x),a.y<l&&(l=a.y))};$.each(f,function(a,c){void 0!=c&&"bounds"in c&&1<_.size(c.bounds)&&p({x:c.bounds[0],y:c.bounds[1]})});$.each(g,function(a,c){void 0!=c&&"x"in c&&"y"in c&&p({x:c.x,y:c.y})});$.each(h,function(a,c){void 0!=c&&"x"in c&&"y"in c&&p({x:c.x,y:c.y})});$.each(m,function(a,c){void 0!=c&&"x"in c&&"y"in c&&p({x:c.x,y:c.y})});$.each(n,function(a,c){void 0!=c&&"x"in c&&"y"in c&&p({x:c.x,y:c.y})})}e.setMinX(k);
e.setMinY(l);$.each(f,function(b,c){if(c&&void 0!=c){var d=c.points,f=c.bounds[0],g=c.bounds[1],h,m,n=f-k;h=g-l;for(var n=-(n-n*a.xScale),p=-(h-h*a.yScale),q=0;q<d.length;q+=3)h=d[q]-f,m=d[q+1]-g,d[q]=f+h*a.xScale+n,d[q+1]=g+m*a.yScale+p;calculateInkBounds(c);e.incorporateBounds(c.bounds)}});$.each(m,function(b,c){if(void 0!=c){c.width*=a.xScale;c.height*=a.yScale;var d=c.x-k,f=c.y-l,f=-(f-f*a.yScale);c.x+=-(d-d*a.xScale);c.y+=f;calculateImageBounds(c);e.incorporateBounds(c.bounds)}});$.each(n,function(b,
c){if(void 0!=c){c.width*=a.xScale;c.height*=a.yScale;var d=c.x-k,f=c.y-l,f=-(f-f*a.yScale);c.x+=-(d-d*a.xScale);c.y+=f;calculateVideoBounds(c);e.incorporateBounds(c.bounds)}});$.each(g,function(b,c){if(void 0!=c){c.width*=a.xScale;c.height*=a.yScale;var d=c.x-k,f=c.y-l,f=-(f-f*a.yScale);c.x+=-(d-d*a.xScale);c.y+=f;c.size*=a.yScale;c.font=sprintf("%spx %s",c.size,c.family);isUsable(c)?(prerenderText(c),calculateTextBounds(c)):c.identity in boardContent.texts&&delete boardContent.texts[c.identity];
e.incorporateBounds(c.bounds)}});$.each(h,function(b,c){if(void 0!=c){c.requestedWidth=(c.width||c.requestedWidth)*a.xScale;c.width=c.requestedWidth;c.doc.width(c.width);_.each(c.words,function(c){c.size*=a.xScale});var d=c.x-k,f=c.y-l;c.doc.position={x:c.x+-(d-d*a.xScale),y:c.y+-(f-f*a.yScale)};c.doc.load(c.words);e.incorporateBounds(c.bounds)}})}if(a.xTranslate||a.yTranslate){var t=a.xTranslate,u=a.yTranslate,b=b+sprintf("translate (%s,%s)",t,u),v=function(a){if(a){for(var c=a.points,b=0;b<c.length;b+=
3)c[b]+=t,c[b+1]+=u;calculateInkBounds(a);e.incorporateBounds(a.bounds)}};$.each(a.inkIds,function(a,b){v(boardContent.inks[b]);v(boardContent.highlighters[b])});$.each(a.videoIds,function(b,c){var d=boardContent.videos[c];console.log("Shifting video",d.x,d.y);d.x+=a.xTranslate;d.y+=a.yTranslate;calculateVideoBounds(d);console.log("Shifting video",d.x,d.y);e.incorporateBounds(d.bounds)});$.each(a.imageIds,function(b,c){var d=boardContent.images[c];console.log("Shifting image",d.x,d.y);d.x+=a.xTranslate;
d.y+=a.yTranslate;calculateImageBounds(d);console.log("Shifting image",d.x,d.y);e.incorporateBounds(d.bounds)});$.each(a.textIds,function(b,c){var d=boardContent.texts[c];d.x+=a.xTranslate;d.y+=a.yTranslate;calculateTextBounds(d);e.incorporateBounds(d.bounds)});$.each(a.multiWordTextIds,function(b,c){if(!(c in Modes.text.echoesToDisregard)){var d=boardContent.multiWordTexts[c],f=d.doc;f.position.x+=a.xTranslate;f.position.y+=a.yTranslate;d.x=f.position.x;d.y=f.position.y;d.doc.invalidateBounds();
e.incorporateBounds(d.bounds)}})}e.incorporateBoardBounds();updateStatus(sprintf("%s %s %s %s %s %s",b,a.imageIds.length,a.textIds.length,a.multiWordTextIds.length,a.inkIds.length,a.videoIds.length));_.each(trackerFrom(a.identity),function(a){updateTracking(a)});blit()}
function moveReceived(a){updateStatus(sprintf("Moving %s, %s, %s",Object.keys(a.images).length,Object.keys(a.texts).length,Object.keys(a.inks).length));$.each(a.inks,function(a,e){boardContent.inks[a]=e});$.each(a.images,function(a,e){boardContent.images[a]=e});$.each(a.texts,function(a,e){boardContent.texts[a]=e});$.each(a.multiWordTexts,function(a,e){boardContent.multiWordTexts[a]=e});blit()}
function deleteInk(a,b,e){if(e in boardContent[a]){var d=boardContent[a][e];d.privacy.toUpperCase()==b.toUpperCase()&&(delete boardContent[a][e],Progress.call("onCanvasContentDeleted",[d]))}}function deleteImage(a,b){var e=boardContent.images[b];e.privacy.toUpperCase()==a.toUpperCase()&&(delete boardContent.images[b],Progress.call("onCanvasContentDeleted",[e]))}
function deleteVideo(a,b){var e=boardContent.videos[b];e.privacy.toUpperCase()==a.toUpperCase()&&(delete boardContent.videos[b],Progress.call("onCanvasContentDeleted",[e]))}function deleteText(a,b){var e=boardContent.texts[b];e.privacy.toUpperCase()==a.toUpperCase()&&(delete boardContent.texts[b],Progress.call("onCanvasContentDeleted",[e]))}
function deleteMultiWordText(a,b){var e=boardContent.multiWordTexts[b];e.privacy.toUpperCase()==a.toUpperCase()&&(delete boardContent.multiWordTexts[b],Progress.call("onCanvasContentDeleted",[e]))}function dirtyInkReceived(a){var b=a.identity;a=a.privacy;deleteInk("highlighters",a,b);deleteInk("inks",a,b);updateStatus(sprintf("Deleted ink %s",b));blit()}function isInClearSpace(a){return!_.some(visibleBounds,function(b){return intersectRect(b,a)})}
function screenBounds(a){var b=worldToScreen(a[0],a[1]);a=worldToScreen(a[2],a[3]);return{screenPos:b,screenLimit:a,screenWidth:a.x-b.x,screenHeight:a.y-b.y}}function scaleCanvas(a,b,e,d){return 1<=b&&1<=e?(d=$("<canvas />"),d.width=b,d.height=e,d.attr("width",b),d.attr("height",e),d.css({width:px(b),height:px(e)}),d[0].getContext("2d").drawImage(a,0,0,b,e),d[0]):a}var mipMappingEnabled=!0;
function multiStageRescale(a,b,e,d){if(mipMappingEnabled){d=void 0==d?{}:d;"mipMap"in d||(d.mipMap={});var f=d.mipMap,g=a.width,h=a.height;if(1<=b&&1<=g&&b<g){var g=.5*g,m=.5*h;if(g<b)return a;h=Math.floor(g);h in f||(a=scaleCanvas(a,g,m),f[h]=a);return multiStageRescale(f[h],b,e,d)}}return a}
function drawImage(a,b){var e=void 0==b?boardContext:b;try{if(void 0!=a.canvas){var d=screenBounds(a.bounds);visibleBounds.push(a.bounds);if(1<=d.screenHeight&&1<=d.screenWidth){var f=.1*d.screenWidth,g=.1*d.screenHeight;e.drawImage(multiStageRescale(a.canvas,d.screenWidth,d.screenHeight,a),d.screenPos.x-f/2,d.screenPos.y-g/2,d.screenWidth+f,d.screenHeight+g)}}}catch(h){console.log("drawImage exception",h)}}function drawMultiwordText(a){Modes.text.draw(a)}
function drawText(a,b){var e=void 0==b?boardContext:b;try{var d=screenBounds(a.bounds);visibleBounds.push(a.bounds);1<=d.screenHeight&&1<=d.screenWidth&&e.drawImage(multiStageRescale(a.canvas,d.screenWidth,d.screenHeight,a),d.screenPos.x,d.screenPos.y,d.screenWidth,d.screenHeight)}catch(f){console.log("drawText exception",f)}}
function drawInk(a,b){var e=void 0==b?boardContext:b,d=screenBounds(a.bounds);visibleBounds.push(a.bounds);var f=a.canvas;f||(f=a.canvas=prerenderInk(a,b));var g=f.width,h=f.height;if(1<=d.screenHeight&&1<=d.screenWidth)if(f=multiStageRescale(f,d.screenWidth,d.screenHeight,a))try{var m=a.thickness/2,n=f.width/g*m,k=f.height/h*m;e.drawImage(f,0,0,f.width,f.height,d.screenPos.x-n,d.screenPos.y-k,d.screenWidth+2*n,d.screenHeight+2*k)}catch(l){console.log("Exception in drawInk",l)}else console.log(a),
f=a.canvas=prerenderInk(a,b),multiStageRescale(f,d.screenWidth,d.screenHeight,a)}function drawVideo(a,b){var e=void 0==b?boardContext:b,d=screenBounds(a.bounds);visibleBounds.push(a.bounds);1<=d.screenHeight&&1<=d.screenWidth&&e.drawImage(a.video,d.screenPos.x,d.screenPos.y,d.screenWidth,d.screenHeight)}
function videoReceived(a){isUsable(a)&&(calculateVideoBounds(a),incorporateBoardBounds(a.bounds),boardContent.videos[a.identity]=a,prerenderVideo(a),WorkQueue.enqueue(function(){if(isInClearSpace(a.bounds)){try{drawVideo(a),Modes.pushCanvasInteractable("videos",videoControlInteractable(a))}catch(b){console.log("drawVideo exception",b)}return!1}console.log("Rerendering video in contested space");return!0}))}
function imageReceived(a){if(isUsable(a)){var b=new Image;a.imageData=b;b.onload=function(){0==a.width&&(a.width=b.naturalWidth);0==a.height&&(a.height=b.naturalHeight);a.bounds=[a.x,a.y,a.x+a.width,a.y+a.height];incorporateBoardBounds(a.bounds);boardContent.images[a.identity]=a;updateTracking(a.identity);prerenderImage(a);WorkQueue.enqueue(function(){if(isInClearSpace(a.bounds)){try{drawImage(a)}catch(b){console.log("drawImage exception",b)}return!1}console.log("Rerendering image in contested space");
return!0})};b.src=calculateImageSource(a)}}function inkReceived(a){isUsable(a)&&(calculateInkBounds(a),updateStrokesPending(-1,a.identity),prerenderInk(a)&&(incorporateBoardBounds(a.bounds),a.isHighlighter?boardContent.highlighters[a.identity]=a:boardContent.inks[a.identity]=a,WorkQueue.enqueue(function(){return isInClearSpace(a.bounds)?(drawInk(a),!1):!0})))}function takeControlOfViewbox(){delete Progress.onBoardContentChanged.autoZooming;UserSettings.setUserPref("followingTeacherViewbox",!0)}
function measureBoardContent(a){a&&_.each(boardContent.multiWordTexts,function(a){a.doc.invalidateBounds()});a=_.flatMap([boardContent.multiWordTexts,boardContent.inks,boardContent.images,boardContent.videos],_.values);0==a.length?(boardContent.height=boardHeight,boardContent.width=boardWidth):(a=_.map(a,"bounds"),a.push([0,0,0,0]),a=_.reduce(a,mergeBounds),boardContent.width=a.width,boardContent.height=a.height,boardContent.minX=a.minX,boardContent.minY=a.minY)}
function zoomToFit(a){Progress.onBoardContentChanged.autoZooming=zoomToFit;if("text"!=Modes.currentMode.name){var b=Modes.select.resizeHandleSize;requestedViewboxWidth=boardContent.width+2*b;requestedViewboxHeight=boardContent.height+2*b;IncludeView.specific(boardContent.minX,boardContent.minY-2*b,requestedViewboxWidth,requestedViewboxHeight,a)}}
function zoomToOriginal(a){takeControlOfViewbox();requestedViewboxWidth=boardWidth;requestedViewboxHeight=boardHeight;IncludeView.specific(0,0,boardWidth,boardHeight,a)}function zoomToPage(a){takeControlOfViewbox();var b=requestedViewboxHeight,e=requestedViewboxWidth;requestedViewboxWidth=boardWidth;requestedViewboxHeight=boardHeight;IncludeView.specific(viewboxX+(e-requestedViewboxWidth)/2,viewboxY+(b-requestedViewboxHeight)/2,boardWidth,boardHeight,a)}
function receiveS2C(a,b){try{$(unescape(b)).addClass("s2cMessage").appendTo("body")}catch(e){console.log("receiveS2C exception:",e)}};
