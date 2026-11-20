#!/usr/bin/env python3
"""Montage reproductible : HF + motion design, sans accès à un service privé.

python3 monter.py --apercus
python3 monter.py
Pillow, NumPy, SciPy et FFmpeg sont nécessaires. Aucun téléchargement implicite.
"""
from __future__ import annotations

import argparse
import json
import math
import subprocess
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.io import wavfile
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent
MEDIA, EXPORT, PREVIEW = (ROOT / p for p in ("media", "exports", "apercus"))
REPO = ROOT.parents[2]
W, H, FPS, LENGTH = 1920, 1080, 24, 30
S = W / 1280
BG = (11, 14, 20)
WHITE = (235, 240, 249)
MUTED = (157, 173, 195)
BLUE = (91, 155, 255)
LINE = (45, 62, 85)
NAVY = (17, 23, 34)
REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

CAPTIONS = [
    [(0.28, 1.48, "Nouvelle release."), (1.48, 4.45, "Les parcours et les accès restent à revérifier.")],
    [(0.28, 4.60, "HSentinel réunit QA et pentest dans votre console.")],
    [(0.28, 2.20, "QA : décrivez le parcours."), (2.20, 4.55, "L’agent l’exécute à l’écran.")],
    [(0.28, 2.32, "Pentest : testez les accès entre comptes,"), (2.32, 4.62, "sur un périmètre défini.")],
    [(0.28, 4.00, "Vous récupérez les étapes, les captures et les résultats.")],
    [(0.28, 1.28, "HSentinel."), (1.28, 3.45, "Premier parcours QA offert."), (3.45, 4.90, "Voyez les preuves.")],
]


def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def clamp(x):
    return min(1.0, max(0.0, x))


def ease(x):
    return 1 - (1 - clamp(x)) ** 3


def pt(x, y):
    return round(x * S), round(y * S)


def box(v):
    return tuple(round(x * S) for x in v)


@lru_cache(maxsize=80)
def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else REGULAR, round(size * S))


def text(draw, xy, value, size=24, color=WHITE, bold=False, anchor=None):
    draw.text(pt(*xy), value, font=font(size, bold), fill=color, anchor=anchor, stroke_width=0)


def rr(draw, xy, fill=NAVY, radius=16, outline=None, width=1):
    draw.rounded_rectangle(box(xy), radius=round(radius * S), fill=fill,
                           outline=outline, width=max(1, round(width * S)))


def line(draw, points, fill=BLUE, width=2):
    draw.line([pt(*p) for p in points], fill=fill, width=round(width * S), joint="curve")


def circle(draw, x, y, r, fill, outline=None, width=1):
    draw.ellipse(box((x-r, y-r, x+r, y+r)), fill=fill, outline=outline, width=round(width*S))


def icon(draw, name, x, y, size=32, color=BLUE):
    k = size / 32
    if name == "cursor":
        draw.polygon([pt(x,y),pt(x+4*k,y+28*k),pt(x+12*k,y+21*k),
                      pt(x+20*k,y+31*k),pt(x+25*k,y+27*k),pt(x+18*k,y+18*k),
                      pt(x+30*k,y+14*k)], fill=color)
    elif name == "user":
        circle(draw,x+16*k,y+9*k,6*k,None,color,2)
        draw.arc(box((x+4*k,y+18*k,x+28*k,y+38*k)),180,360,fill=color,width=round(2*S))
    elif name == "document":
        rr(draw,(x+4*k,y,x+28*k,y+32*k),None,4,color,2)
        for a,b in ((10,23),(17,23),(24,19)):
            line(draw,[(x+10*k,y+a*k),(x+b*k,y+a*k)],color,2)
    elif name == "path":
        line(draw,[(x+3*k,y+5*k),(x+22*k,y+5*k),(x+22*k,y+25*k),(x+5*k,y+25*k)],color,2)
        for px,py in ((3,5),(22,25)):
            circle(draw,x+px*k,y+py*k,4*k,color)
    elif name == "capture":
        rr(draw,(x,y+3*k,x+32*k,y+27*k),None,4,color,2)
        circle(draw,x+16*k,y+15*k,6*k,None,color,2)
    elif name == "arrow":
        line(draw,[(x,y+16*k),(x+30*k,y+16*k)],color,2)
        line(draw,[(x+21*k,y+7*k),(x+30*k,y+16*k),(x+21*k,y+25*k)],color,2)
    elif name == "shield":
        line(draw,[(x+16*k,y),(x+30*k,y+6*k),(x+28*k,y+23*k),(x+16*k,y+33*k),
                   (x+4*k,y+23*k),(x+2*k,y+6*k),(x+16*k,y)],color,2)


@lru_cache(maxsize=1)
def base():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    xx, yy = xx / W, yy / H
    glow = np.exp(-((xx-.77)**2 / .14 + (yy-.47)**2 / .21))
    lower = np.exp(-((xx-.36)**2 / .15 + (yy-1.14)**2 / .06))
    arr = np.zeros((H,W,3), dtype=np.float32) + np.array(BG)
    arr += glow[:,:,None] * np.array([5,15,31])
    arr += lower[:,:,None] * np.array([0,7,20])
    rng = np.random.default_rng(42)
    arr += rng.uniform(-.65,.65,(H,W,1))
    return Image.fromarray(np.uint8(np.clip(arr,0,255))).convert("RGBA")


@lru_cache(maxsize=4)
def plate(name):
    return Image.open(MEDIA / name).convert("RGBA")


def insert_plate(im, source, xy, opacity=.8, zoom=1.0):
    x,y,w,h = xy
    size = (round(w*S*zoom), round(h*S*zoom))
    source = source.resize(size, Image.Resampling.LANCZOS)
    source.putalpha(round(255 * opacity))
    im.alpha_composite(source, (round((x-w*(zoom-1)/2)*S), round((y-h*(zoom-1)/2)*S)))


@lru_cache(maxsize=1)
def edge_mask():
    # Cache un dégradé qui fond les plates 3D dans la scène graphique.
    y,x = np.mgrid[0:H,0:W].astype(np.float32)
    x,y=x/S,y/S
    left = 1 - np.clip((x-450)/180,0,1)
    vertical = np.maximum(1-np.clip((y-120)/150,0,1),np.clip((y-530)/90,0,1))
    edge = np.maximum(left, vertical)
    a = np.uint8(np.clip(edge*.92+.12,0,1)*255)
    overlay = base().copy()
    overlay.putalpha(Image.fromarray(a))
    return overlay


def apply_plate(im,name,t,opacity=.72):
    # Mise en scène locale des images HF; aucun texte des images n'est utilisé.
    insert_plate(im,plate(name),(450,155,820,461),opacity,1.015+.026*t/5)
    im.alpha_composite(edge_mask())


@lru_cache(maxsize=1)
def logo():
    return Image.open(REPO / "sentinelqa/web-console/public/logo-mark.png").convert("RGBA")


def paste_logo(im,x,y,size):
    m = logo().resize((round(size*S),round(size*S)),Image.Resampling.LANCZOS)
    im.alpha_composite(m,pt(x,y))


def header(im, scene, t):
    d=ImageDraw.Draw(im)
    paste_logo(im,64,40,37)
    text(d,(115,43),"HSentinel",25,bold=True)
    text(d,(1214,47),"QA  +  PENTEST",14,MUTED,bold=True,anchor="ra")
    line(d,[(64,101),(1216,101)],(39,52,72),1)
    if 1<=scene<=4:
        text(d,(1214,122),"ILLUSTRATION PRODUIT",12,MUTED,anchor="ra")
    # Les six repères suivent le temps du film, sans imiter un KPI du produit.
    for j in range(6):
        x=64+j*194
        line(d,[(x,704),(x+180,704)],(34,46,63),2)
        amount=1 if j<scene else (t/5 if j==scene else 0)
        if amount:
            line(d,[(x,704),(x+180*amount,704)],BLUE,2)


def eyebrow(draw, value, y=173):
    circle(draw,70,y+9,3,BLUE)
    text(draw,(85,y),value,14,BLUE,True)


def headline(draw, lines, t, top=217, size=58, spacing=67, accent=-1):
    off=(1-ease(t/.7))*20
    for i,value in enumerate(lines):
        text(draw,(64,top+i*spacing+off),value,size,BLUE if i==accent else WHITE,True)


def mini_label(draw,xy,value):
    text(draw,xy,value,15,MUTED)


def scene_intro(im,t):
    apply_plate(im,"p1.webp",t,.88)
    d=ImageDraw.Draw(im)
    eyebrow(d,"POUR LES ÉQUIPES SAAS")
    headline(d,["Nouvelle", "release."],t,size=76,spacing=83)
    text(d,(67,411),"Mêmes vérifications.",31,BLUE,True)
    text(d,(67,465),"Vos parcours. Vos accès.",23,MUTED)
    text(d,(67,498),"Votre temps d’ingénierie.",23,MUTED)
    # Circuit récurrent : un repère avance puis revient, aucune donnée chiffrée.
    y=566
    line(d,[(627,y),(1137,y)],(67,84,108),2)
    for i,label in enumerate(["Release","QA","Accès"]):
        x=643+i*238
        circle(d,x,y,5,BLUE)
        text(d,(x,y+21),label,16,MUTED,anchor="ma")
    x=643+476*(t%2.5)/2.5
    circle(d,x,y,8,BLUE)


def scene_console(im,t):
    d=ImageDraw.Draw(im)
    # Volumes qui soulignent la profondeur de la console.
    for j in range(3,0,-1):
        rr(d,(564+j*9,202-j*9,1216+j*9,564-j*9),(13,22,37),20,(31,48,72))
    rr(d,(564,202,1216,564),(14,20,31),18,(64,90,123),1)
    rr(d,(565,203,1215,249),(23,33,48),17)
    for j in range(3):circle(d,586+15*j,225,3,(89,109,137))
    text(d,(1192,216),"Nouvelle mission",15,MUTED,anchor="ra")
    line(d,[(690,250),(690,563)],LINE,1)
    text(d,(585,276),"CONSOLE",11,MUTED,True)
    for j,label in enumerate(["Missions","Rapports","Applications"]):
        if j==0:rr(d,(576,305,679,341),(29,49,79),7)
        text(d,(587,315+j*43),label,14,WHITE if j==0 else MUTED)
    text(d,(716,275),"Que voulez-vous vérifier ?",24,WHITE,True)
    for j,(title,sub,name) in enumerate([
        ("QA","Parcours utilisateurs","cursor"),
        ("Pentest","Contrôles d’accès","shield")]):
        x=716+j*238
        active=(t%4<2 and j==0) or (t%4>=2 and j==1)
        rr(d,(x,328,x+219,495),(20,34,54) if active else (18,27,41),12,
           BLUE if active else (54,73,100),2 if active else 1)
        icon(d,name,x+22,348,32,BLUE)
        text(d,(x+22,401),title,26,WHITE,True)
        text(d,(x+22,444),sub,15,MUTED)
    text(d,(716,522),"Une consigne. Un périmètre. Des preuves.",17,MUTED)
    eyebrow(d,"HSENTINEL")
    headline(d,["QA.","Pentest.","Une console."],t,size=62,spacing=72,accent=2)
    text(d,(67,479),"Choisissez le contrôle.",23,MUTED)
    text(d,(67,514),"Retrouvez les preuves.",23,MUTED)


def scene_qa(im,t):
    apply_plate(im,"p3.webp",t,.40)
    d=ImageDraw.Draw(im)
    eyebrow(d,"QA · PARCOURS UTILISATEURS")
    headline(d,["Décrivez.","L’agent agit."],t,size=62,spacing=74,accent=1)
    text(d,(67,401),"Il clique, saisit, navigue.",24,MUTED)
    text(d,(67,438),"Sur l’interface de votre app.",23,MUTED)
    rr(d,(561,190,1216,249),(20,34,55),12,(54,82,119))
    text(d,(581,209),"« Se connecter et ouvrir les documents. »",21,WHITE)
    rr(d,(591,273,1186,538),(15,24,38),15,(70,92,122))
    rr(d,(592,274,1185,312),(29,41,60),14)
    for j in range(3):circle(d,613+14*j,293,3,(94,116,144))
    text(d,(1165,284),"Application de démonstration",13,MUTED,anchor="ra")
    login=t<2.1
    if login:
        text(d,(622,339),"Connexion",26,WHITE,True)
        rr(d,(622,385,1154,429),(23,35,53),6,(52,72,99))
        text(d,(640,397),"Compte de démonstration",18,MUTED)
        rr(d,(622,445,981,491),(23,35,53),6,(52,72,99))
        text(d,(641,458),"••••••••••••",18,MUTED)
        rr(d,(998,445,1154,491),(45,113,222),7)
        text(d,(1076,459),"Se connecter",16,WHITE,True,anchor="ma")
        k=ease((t-.45)/1.30)
        x,y=1134-62*k,361+112*k
        if t>1.65:circle(d,1075,472,20+16*(t-1.65),None,BLUE,2)
        icon(d,"cursor",x,y,28,WHITE)
    else:
        text(d,(622,339),"Espace Documents",26,WHITE,True)
        for i in range(3):
            x=623+i*176
            rr(d,(x,390,x+159,507),(22,36,56),8,(45,64,90))
            icon(d,"document",x+17,405,26,BLUE)
            text(d,(x+17,463),["Document A","Document B","Document C"][i],16,MUTED)
        icon(d,"cursor",947-100*ease((t-2.1)/1.9),445,28,WHITE)
    line(d,[(610,577),(1170,577)],(54,78,110),2)
    stages=[("Connexion",638),("Accueil",884),("Documents",1132)]
    for i,(label,x) in enumerate(stages):
        active=t >= [.3,2.1,2.7][i]
        circle(d,x,577,5,BLUE if active else (58,73,96))
        text(d,(x,594),label,15,MUTED,anchor="ma")


@lru_cache(maxsize=1)
def video_frames():
    # 2,6 secondes du clip LTX : évite le recadrage trop serré en fin de génération.
    raw=subprocess.check_output(["ffmpeg","-v","error","-i",str(MEDIA/"p4.mp4"),
        "-t","2.625","-vf","fps=24,scale=960:540","-f","rawvideo","-pix_fmt","rgb24","-"])
    a=np.frombuffer(raw,dtype=np.uint8).reshape((-1,540,960,3))
    return [Image.fromarray(frame).convert("RGBA") for frame in a]


def scene_access(im,t):
    frames=video_frames()
    f=frames[min(len(frames)-1,int(t/5*len(frames)))].copy()
    insert_plate(im,f,(490,182,785,442),.77)
    im.alpha_composite(edge_mask())
    d=ImageDraw.Draw(im)
    eyebrow(d,"PENTEST · CONTRÔLES D’ACCÈS")
    headline(d,["Qui peut", "accéder", "à quoi ?"],t,size=65,spacing=73,accent=2)
    text(d,(67,484),"Deux comptes.",23,MUTED)
    text(d,(67,520),"Une règle à vérifier.",23,MUTED)
    for x,label in [(620,"COMPTE A"),(1000,"COMPTE B")]:
        rr(d,(x,198,x+179,246),(19,32,52),10,(63,88,125))
        icon(d,"user",x+13,210,23,BLUE)
        text(d,(x+48,214),label,17,WHITE,True)
    rr(d,(568,524,1216,605),(16,25,40),12,(62,83,112))
    text(d,(590,541),"RÈGLE TESTÉE",12,BLUE,True)
    text(d,(590,566),"B ne doit pas lire les documents de A.",22,WHITE)
    # Trajectoire de contrôle; aucun résultat de sécurité inventé.
    p=ease((t-.7)/3.0)
    line(d,[(1148,479),(617,479)],(71,91,121),2)
    circle(d,1148-531*p,479,7,BLUE)
    text(d,(889,442),"Vérification de l’accès",16,MUTED,anchor="ma")


def scene_evidence(im,t):
    apply_plate(im,"p5.webp",t,.42)
    d=ImageDraw.Draw(im)
    eyebrow(d,"RAPPORT DE VÉRIFICATION")
    headline(d,["Chaque contrôle.","Ses preuves."],t,size=49,spacing=63,accent=1)
    text(d,(67,391),"Des étapes consultables.",24,MUTED)
    text(d,(67,430),"Des constats à examiner.",24,MUTED)
    labels=[("Étapes","path"),("Captures","capture"),("Résultats","document")]
    for i,(label,name) in enumerate(labels):
        x=579+i*214
        off=(1-ease((t-.12*i)/.65))*20
        rr(d,(x,225+off,x+194,353+off),(20,33,53),12,(61,86,120))
        icon(d,name,x+21,244+off,31,BLUE)
        text(d,(x+21,303+off),label,23,WHITE,True)
        line(d,[(x+97,356),(x+97,393),(889,393),(889,421)],(58,103,166),2)
    rr(d,(579,421,1201,572),(16,27,43),16,(74,107,151))
    icon(d,"document",604,447,37,BLUE)
    text(d,(663,447),"Rapport de vérification",26,WHITE,True)
    text(d,(604,507),"Parcours  ·  Accès  ·  Preuves  ·  Limites",19,MUTED)
    line(d,[(604,545),(1172,545)],(46,66,95),1)
    text(d,(67,502),"Décidez, preuves à l’appui.",23,BLUE,True)


def scene_end(im,t):
    d=ImageDraw.Draw(im)
    # Courbes contrôlées, pas de texte généré ni de métriques inventées.
    for i in range(4):
        off=i*52
        col=(20+i*4,41+i*5,70+i*9)
        d.arc(box((183-off,154-off,1097+off,850+off)),184,356,fill=col,width=round(S))
    for x,y in [(284,293),(1029,377),(1104,222),(154,445)]:
        circle(d,x,y,2,(74,113,172))
    paste_logo(im,493,159,52)
    text(d,(562,164),"HSentinel",39,WHITE,True)
    text(d,(640,245),"Votre prochain contrôle, preuves à l’appui.",22,MUTED,anchor="ma")
    rise=(1-ease(t/.65))*18
    text(d,(640,305+rise),"Premier parcours QA",61,WHITE,True,anchor="ma")
    text(d,(640,374+rise),"offert.",67,BLUE,True,anchor="ma")
    text(d,(640,468),"1 application · 1 parcours · rapport inclus",23,MUTED,anchor="ma")
    rr(d,(455,524,825,587),(47,115,225),12,(104,165,255),1)
    text(d,(621,543),"Réserver mon essai",25,WHITE,True,anchor="ma")
    icon(d,"arrow",776,542,23,WHITE)


SCENES=[scene_intro,scene_console,scene_qa,scene_access,scene_evidence,scene_end]


def frame(scene,t,subtitles=True):
    im=base().copy()
    SCENES[scene](im,t)
    header(im,scene,t)
    if subtitles:
        for start,end,caption in CAPTIONS[scene]:
            if start<=t<end:
                d=ImageDraw.Draw(im)
                tw=d.textlength(caption,font=font(23)) / S
                rr(d,(640-tw/2-20,644,640+tw/2+20,686),(7,11,18),8)
                text(d,(640,656),caption,23,WHITE,anchor="ma")
                break
    # Raccord bref à la fermeture d'un plan, pour garder la lecture stable.
    if scene<5 and t>4.84:
        veil=Image.new("RGBA",(W,H),(*BG,round(255*.35*(t-4.84)/.16)))
        im=Image.alpha_composite(im,veil)
    return im.convert("RGB")


def previews():
    PREVIEW.mkdir(exist_ok=True)
    thumbs=[]
    for i in range(6):
        f=frame(i,2.85)
        f.save(PREVIEW/f"plan-{i+1}.jpg",quality=94)
        thumbs.append(f.resize((640,360),Image.Resampling.LANCZOS))
    sheet=Image.new("RGB",(1280,1080),BG)
    for i,f in enumerate(thumbs):sheet.paste(f,((i%2)*640,(i//2)*360))
    sheet.save(PREVIEW/"storyboard.jpg",quality=94)
    frame(5,3.2,False).save(EXPORT/"HSentinel-affiche.jpg",quality=95)


def synth_music():
    sr=48000
    n=LENGTH*sr
    music=np.zeros((n,2),np.float64)
    rng=np.random.default_rng(91)
    chords=[[50,57,60,65],[46,53,57,62],[53,60,64,69],[48,55,60,64]]
    def add(start,sig,pan=0):
        pos=round(start*sr)
        if pos>=n:return
        sig=sig[:n-pos]
        music[pos:pos+len(sig),0]+=sig*math.sqrt((1-pan)/2)
        music[pos:pos+len(sig),1]+=sig*math.sqrt((1+pan)/2)
    # Pad doux sur 4 accords, harmonies originales de synthèse.
    for k in range(8):
        start=k*4.57142857
        if start>=30:break
        ts=np.arange(round(5.2*sr))/sr
        env=np.minimum(ts/.7,1)*np.minimum((5.2-ts)/1.2,1)
        sig=np.zeros_like(ts)
        for note in chords[k%4]:
            hz=440*2**((note-69)/12)
            sig+=np.sin(2*np.pi*hz*ts+.12*np.sin(2*np.pi*.16*ts))
            sig+=.18*np.sin(2*np.pi*hz*2.003*ts)
        add(start,sig*env*.012,(-1 if k%2 else 1)*.22)
    beat=60/105
    for k in range(math.ceil(30/beat)):
        start=k*beat
        # Un pluck discret; pas de mélodie empruntée.
        ts=np.arange(round(.65*sr))/sr
        note=chords[int(start/4.57142857)%4][[0,2,1,3][k%4]]+12
        hz=440*2**((note-69)/12)
        sig=(np.sin(2*np.pi*hz*ts)+.2*np.sin(2*np.pi*2*hz*ts))*np.exp(-ts*9)*(1-np.exp(-ts*180))
        add(start,sig*.020,(-.45 if k%2 else .45))
        if k%2==0:
            tt=np.arange(round(.14*sr))/sr
            kick=np.sin(2*np.pi*(48*tt+11*(1-np.exp(-tt*22))/22))*np.exp(-tt*31)
            add(start,kick*.038)
        tt=np.arange(round(.055*sr))/sr
        noise=rng.standard_normal(len(tt))
        noise=np.diff(noise,prepend=0)*np.exp(-tt*95)
        add(start+beat*.5,noise*.003, .5)
    for start in [5,10,15,20,25]:
        ts=np.arange(round(.45*sr))/sr
        chirp=np.sin(2*np.pi*(440*ts+250*ts**2))*np.sin(np.pi*ts/.45)**2
        add(start,chirp*.009)
    times=np.arange(n)/sr
    fade=np.minimum(times/1.2,1)*np.minimum((30-times)/1.1,1)
    music*=fade[:,None]
    return music


def audio_mix():
    sr=48000
    voice=np.zeros((30*sr,2),np.float64)
    timings=[]
    for i in range(6):
        rate,samples=wavfile.read(MEDIA/f"voix-{i+1}.wav")
        samples=samples.astype(np.float64)/32768
        if samples.ndim>1:samples=samples.mean(axis=1)
        divisor=math.gcd(sr,rate)
        samples=resample_poly(samples,sr//divisor,rate//divisor)
        # Retire uniquement les silences longs, garde les consonnes et les pauses.
        active=np.flatnonzero(np.abs(samples)>.004)
        if len(active):
            samples=samples[max(0,active[0]-int(.035*sr)):min(len(samples),active[-1]+int(.10*sr))]
        duration=len(samples)/sr
        if duration>4.45:
            raise ValueError(f"La voix du plan {i+1} déborde: {duration:.2f}s")
        rms=np.sqrt(np.mean(samples**2))
        gain=min(.135/max(rms,.0001),.83/max(np.max(np.abs(samples)),.0001))
        samples*=gain
        start=i*5+.30
        pos=round(start*sr)
        voice[pos:pos+len(samples),:]+=samples[:,None]
        timings.append({"scene":i+1,"debut_s":start,"fin_s":round(start+duration,3),"gain_db":round(20*math.log10(gain),2)})
    music=synth_music()
    # Ducking doux autour des lignes de voix.
    envelope=np.ones(30*sr)
    for timing in timings:
        a,b=int(timing["debut_s"]*sr),int(timing["fin_s"]*sr)
        envelope[a:b]=.40
        ramp=int(.15*sr)
        lo=max(0,a-ramp)
        envelope[lo:a]=np.minimum(envelope[lo:a],np.linspace(1,.40,a-lo))
        hi=min(len(envelope),b+ramp)
        envelope[b:hi]=np.minimum(envelope[b:hi],np.linspace(.40,1,hi-b))
    mixed=voice+music*envelope[:,None]
    peak=np.max(np.abs(mixed))
    if peak>.89:mixed*=.89/peak
    for name,signal in [("musique-originale.wav",music),("voix-fr.wav",voice),("mix-brut.wav",mixed)]:
        wavfile.write(EXPORT/name,sr,np.int16(np.clip(signal,-1,1)*32767))
    (EXPORT/"timings-voix.json").write_text(json.dumps(timings,ensure_ascii=False,indent=2)+"\n")
    run(["ffmpeg","-v","warning","-y","-i",str(EXPORT/"mix-brut.wav"),
         "-af","loudnorm=I=-16:TP=-1:LRA=7","-ar","48000",str(EXPORT/"mix-final.wav")])


def captions():
    def stamp(sec):
        ms=round(sec*1000)
        return f"00:{ms//60000:02d}:{ms//1000%60:02d},{ms%1000:03d}"
    lines=[]
    for i,segments in enumerate(CAPTIONS):
        for a,b,s in segments:
            lines.append(f"{len(lines)+1}\n{stamp(i*5+a)} --> {stamp(i*5+b)}\n{s}\n")
    (EXPORT/"HSentinel-30s-fr.srt").write_text("\n".join(lines),encoding="utf-8")


def render():
    out=EXPORT/"HSentinel-30s-1080p.mp4"
    args=["ffmpeg","-v","warning","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}",
          "-r",str(FPS),"-i","-","-i",str(EXPORT/"mix-final.wav"),"-map","0:v:0","-map","1:a:0",
          "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-c:a","aac",
          "-b:a","192k","-t","30","-movflags","+faststart","-metadata",
          "title=HSentinel — Votre prochaine release, preuves à l’appui",
          "-metadata","comment=Publicité illustrée. Visuels HF et motion design. Scénarios fictifs, aucun résultat client.",str(out)]
    proc=subprocess.Popen(args,stdin=subprocess.PIPE)
    try:
        for n in range(FPS*LENGTH):
            scene=n//(FPS*5)
            t=(n%(FPS*5))/FPS
            proc.stdin.write(frame(scene,t).tobytes())
            if n%(FPS*5)==0:print(f"Rendu plan {scene+1}/6",flush=True)
        proc.stdin.close()
        if proc.wait():raise RuntimeError("Échec de l’encodage vidéo")
    except BaseException:
        proc.kill()
        proc.wait()
        raise
    print(out,flush=True)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--apercus",action="store_true")
    args=parser.parse_args()
    for p in [MEDIA,EXPORT,PREVIEW]:p.mkdir(exist_ok=True)
    previews()
    captions()
    if not args.apercus:
        audio_mix()
        render()


if __name__=="__main__":main()
