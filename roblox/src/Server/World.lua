local World={}
local function part(parent,name,size,position,color,material)
    local p=Instance.new("Part");p.Name=name;p.Size=size;p.Position=position
    p.Anchored=true;p.CanCollide=false;p.CanTouch=false;p.Material=material or Enum.Material.Slate
    p.Color=Color3.fromRGB(color[1],color[2],color[3]);p.Parent=parent
    return p
end
function World.build(c)
    local preview=workspace:FindFirstChild("EditorPreview");if preview then preview:Destroy() end
    local folder=Instance.new("Folder");folder.Name="SapiensForest";folder.Parent=workspace
    local light=game:GetService("Lighting")
    light.ClockTime=9.5;light.Brightness=2.5;light.ExposureCompensation=.25
    light.GlobalShadows=false;light.EnvironmentDiffuseScale=.6
    light.Ambient=Color3.fromRGB(125,150,145)
    light.OutdoorAmbient=Color3.fromRGB(145,165,180)
    local atmosphere=Instance.new("Atmosphere");atmosphere.Density=.12;atmosphere.Haze=.4;atmosphere.Color=Color3.fromRGB(175,210,205);atmosphere.Decay=Color3.fromRGB(100,135,160);atmosphere.Parent=light
    local bloom=Instance.new("BloomEffect");bloom.Intensity=.15;bloom.Size=20;bloom.Threshold=1.1;bloom.Parent=light
    local track=part(folder,"Stone trail",Vector3.new(25,2,c.Length+70),Vector3.new(0,-1,-c.Length/2),{78,104,98})
    track.CanCollide=true
    part(folder,"Forest floor",Vector3.new(150,2,c.Length+70),Vector3.new(0,-2,-c.Length/2),{43,85,59},Enum.Material.Grass)
    for _,side in ipairs({-1,1}) do
        part(folder,"Trail edge",Vector3.new(.2,.15,c.Length+60),Vector3.new(side*12.5,.1,-c.Length/2),{89,176,169},Enum.Material.Neon)
    end
    local rng=Random.new(7301)
    for d=0,c.Length,30 do
        for _,side in ipairs({-1,1}) do
            local x=side*(20+rng:NextNumber(0,8))
            local tree=part(folder,"Ancient trunk",Vector3.new(3,18,3),Vector3.new(x,9,-d),{55,86,64},Enum.Material.Wood)
            tree.Orientation=Vector3.new(0,0,side*8)
            local crown=part(folder,"Canopy",Vector3.new(15,9,14),Vector3.new(x,21,-d),{48,rng:NextInteger(125,165),105},Enum.Material.Grass)
            crown.Shape=Enum.PartType.Ball
            local vine=part(folder,"Luminous vine",Vector3.new(.14,10,.14),Vector3.new(x-side*4,15,-d),{44,154,132},Enum.Material.Neon)
            local rock=part(folder,"Trail crystal",Vector3.new(.7,2,.7),Vector3.new(side*13,1,-d),{51,136,160},Enum.Material.Neon)
            rock.Orientation=Vector3.new(0,45,side*16)
        end
        for lane=-1,1 do
            part(folder,"Paving",Vector3.new(6.4,.08,10),Vector3.new(lane*c.LaneWidth,.04,-d),{126,153,144})
        end
    end
    local obstacles,supplies={},{}
    local types={"jump","slide","block"}
    for i=1,24 do
        local lane=(i%3)-1;local d=55+i*32;local kind=types[(i%3)+1]
        local size=kind=="jump" and Vector3.new(5,2.6,2) or kind=="slide" and Vector3.new(6,2,2) or Vector3.new(5,7,3)
        local y=kind=="slide" and 5.5 or size.Y/2
        local p=part(folder,"Obstacle_"..i,size,Vector3.new(lane*c.LaneWidth,y,-d),{102,138,160})
        if kind=="slide" then
            for _,side in ipairs({-1,1}) do part(folder,"Arch support",Vector3.new(.35,6,.5),Vector3.new(lane*c.LaneWidth+side*3.15,3,-d),{78,119,132}) end
        end
        part(folder,"Hazard marking",Vector3.new(3,.12,.12),Vector3.new(lane*c.LaneWidth,y+size.Y/2+.1,-d+1.2),{146,192,148},Enum.Material.Neon)
        table.insert(obstacles,{id=i,lane=lane,d=d,kind=kind})
    end
    for i=1,42 do
        local d=20+i*20;local lane=i%2==0 and 0 or ((i%3)-1)
        local p=part(folder,"Supply_"..i,Vector3.new(1,1,1),Vector3.new(lane*c.LaneWidth,2,-d),{93,201,165},Enum.Material.Neon)
        p.Orientation=Vector3.new(20,45,20)
        table.insert(supplies,{id=i,lane=lane,d=d})
    end
    for _,d in ipairs({180,c.Length}) do
        for _,side in ipairs({-1,1}) do part(folder,"Story pillar",Vector3.new(2,12,2),Vector3.new(side*14,6,-d),{43,76,73}) end
        part(folder,"Story arch",Vector3.new(30,1,2),Vector3.new(0,12,-d),{52,137,132},Enum.Material.Neon)
    end
    local spawn=Instance.new("SpawnLocation");spawn.Name="ForestStart";spawn.Anchored=true;spawn.Neutral=true;spawn.Duration=0
    spawn.Transparency=1;spawn.CanCollide=false;spawn.Size=Vector3.new(4,1,4);spawn.Position=Vector3.new(0,3,0);spawn.Parent=folder
    return obstacles,supplies
end
return World
