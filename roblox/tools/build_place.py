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
item(root,'Workspace','Workspace')
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
item(root,'Lighting','Lighting')
ET.indent(root)
out=ROOT/'SapiensForest.rbxlx'
ET.ElementTree(root).write(out,encoding='utf-8',xml_declaration=True)
print(out)
