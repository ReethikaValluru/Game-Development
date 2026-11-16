"""Build a self-contained, text-format Roblox place; no third-party plugins required."""
from pathlib import Path
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
root=ET.Element('roblox',{'version':'4'})
ET.SubElement(root,'External').text='null'
ET.SubElement(root,'External').text='nil'
def item(parent,kind,name,source=None):
    node=ET.SubElement(parent,'Item',{'class':kind,'referent':f'RBX{len(list(root.iter()))}'})
    props=ET.SubElement(node,'Properties')
    ET.SubElement(props,'string',{'name':'Name'}).text=name
    if source is not None:ET.SubElement(props,'ProtectedString',{'name':'Source'}).text=source
    return node
world=item(root,'Workspace','Workspace')
# An actual opening scene is included so import does not show an empty editor.
# Runtime replaces only this named preview with the complete procedural world.
preview=item(world,'Folder','EditorPreview')
def prop(node,kind,name,value):
    el=ET.SubElement(node.find('Properties'),kind,{'name':name})
    el.text=str(value)
    return el
def vector(node,name,xyz):
    el=ET.SubElement(node.find('Properties'),'Vector3',{'name':name})
    for axis,v in zip(('X','Y','Z'),xyz):ET.SubElement(el,axis).text=str(v)
def frame(node,name,position,rotation=(1,0,0,0,1,0,0,0,1)):
    el=ET.SubElement(node.find('Properties'),'CoordinateFrame',{'name':name})
    for key,v in zip(('X','Y','Z','R00','R01','R02','R10','R11','R12','R20','R21','R22'),(*position,*rotation)):ET.SubElement(el,key).text=str(v)
def color(node,name,rgb):
    el=ET.SubElement(node.find('Properties'),'Color3',{'name':name})
    for axis,v in zip(('R','G','B'),rgb):ET.SubElement(el,axis).text=str(v/255)
def part(name,size,position,rgb,ball=False):
    n=item(preview,'Part',name)
    prop(n,'bool','Anchored','true');prop(n,'bool','CanCollide','false')
    vector(n,'size',size);frame(n,'CFrame',position)
    prop(n,'Color3uint8','Color3uint8',rgb[0]*65536+rgb[1]*256+rgb[2])
    prop(n,'token','shape',0 if ball else 1)
    return n
part('Forest floor',(150,2,280),(0,-2,-110),(43,85,59))
part('Trail',(25,2,280),(0,-1,-110),(78,104,98))
for d in range(0,241,30):
    for side in (-1,1):
        part('Trunk',(3,18,3),(side*23,9,-d),(55,86,64))
        part('Green canopy',(15,9,14),(side*23,21,-d),(48,145,105),True)
        part('Blue trail crystal',(1,2,1),(side*13,1,-d),(89,176,190))
    for lane in (-1,0,1):part('Paving',(6.4,.08,10),(lane*7,.04,-d),(126,153,144))
for i in range(1,10):part('Supply',(1,1,1),(0,2,-20*i),(93,201,165))
part('Jump log',(5,2.6,2),(-7,1.3,-55),(102,138,160))
part('Standing stone',(5,7,3),(7,3.5,-90),(102,138,160))
camera=item(world,'Camera','Camera')
# Camera looks down the trail from a slightly elevated third-person view.
import math
angle=math.radians(18);co=math.cos(angle);si=math.sin(angle)
frame(camera,'CFrame',(0,15,30),(1,0,0,0,co,si,0,-si,co))
frame(camera,'Focus',(0,3,-15))
prop(camera,'float','FieldOfView',70)
prop(world,'Ref','CurrentCamera',camera.attrib['referent'])
rs=item(root,'ReplicatedStorage','ReplicatedStorage')
shared=item(rs,'Folder','Sapiens')
for name in ['Config','Rules']:item(shared,'ModuleScript',name,(ROOT/f'src/Shared/{name}.lua').read_text())
server=item(root,'ServerScriptService','ServerScriptService')
folder=item(server,'Folder','SapiensServer')
item(folder,'ModuleScript','World',(ROOT/'src/Server/World.lua').read_text())
item(folder,'Script','Main',(ROOT/'src/Server/Main.server.lua').read_text())
starter=item(root,'StarterPlayer','StarterPlayer')
scripts=item(starter,'StarterPlayerScripts','StarterPlayerScripts')
item(scripts,'LocalScript','SapiensClient',(ROOT/'src/Client/Main.client.lua').read_text())
lighting=item(root,'Lighting','Lighting')
prop(lighting,'float','Brightness',2.5)
prop(lighting,'float','ClockTime',9.5)
# TimeOfDay is serialized as well for Studio versions that persist that form.
prop(lighting,'string','TimeOfDay','09:30:00')
prop(lighting,'float','ExposureCompensation',.25)
prop(lighting,'bool','GlobalShadows','false')
color(lighting,'Ambient',(125,150,145))
color(lighting,'OutdoorAmbient',(145,165,180))
ET.indent(root)
out=ROOT/'SapiensForest.rbxlx'
ET.ElementTree(root).write(out,encoding='utf-8',xml_declaration=True)
print(out)
