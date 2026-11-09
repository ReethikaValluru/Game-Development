local World={}
local function part(parent,name,size,position,color,material)
    local p=Instance.new("Part");p.Name=name;p.Size=size;p.Position=position
    p.Anchored=true;p.CanCollide=false;p.CanTouch=false;p.Material=material or Enum.Material.Slate
    p.Color=Color3.fromRGB(color[1],color[2],color[3]);p.Parent=parent
    return p
end
function World.build(c)
    local folder=Instance.new("Folder");folder.Name="SapiensForest";folder.Parent=workspace
    local light=game:GetService("Lighting")
    light.ClockTime=0;light.Brightness=2;light.Ambient=Color3.fromRGB(32,65,60)
    light.OutdoorAmbient=Color3.fromRGB(23,43,61)
    local atmosphere=Instance.new("Atmosphere");atmosphere.Density=.32;atmosphere.Color=Color3.fromRGB(61,112,102);atmosphere.Decay=Color3.fromRGB(12,32,51);atmosphere.Parent=light
    local bloom=Instance.new("BloomEffect");bloom.Intensity=.35;bloom.Size=20;bloom.Threshold=1.1;bloom.Parent=light
    local track=part(folder,"Stone trail",Vector3.new(25,2,c.Length+70),Vector3.new(0,-1,-c.Length/2),{39,66,59})
    track.CanCollide=true
    local rng=Random.new(7301)
    for d=0,c.Length,30 do
        for _,side in ipairs({-1,1}) do
            local x=side*(20+rng:NextNumber(0,8))
            local tree=part(folder,"Ancient trunk",Vector3.new(3,18,3),Vector3.new(x,9,-d),{22,49,39},Enum.Material.Wood)
            tree.Orientation=Vector3.new(0,0,side*8)
            local crown=part(folder,"Canopy",Vector3.new(15,9,14),Vector3.new(x,21,-d),{25,rng:NextInteger(70,105),67},Enum.Material.Grass)
            crown.Shape=Enum.PartType.Ball
            local vine=part(folder,"Luminous vine",Vector3.new(.14,10,.14),Vector3.new(x-side*4,15,-d),{44,154,132},Enum.Material.Neon)
            local rock=part(folder,"Trail crystal",Vector3.new(.7,2,.7),Vector3.new(side*13,1,-d),{51,136,160},Enum.Material.Neon)
            rock.Orientation=Vector3.new(0,45,side*16)
        end
        for lane=-1,1 do
            part(folder,"Paving",Vector3.new(6.4,.08,10),Vector3.new(lane*c.LaneWidth,.04,-d),{67,87,80})
        end
    end
    local obstacles,supplies={},{}
    local types={"jump","slide","block"}
    for i=1,24 do
        local lane=(i%3)-1;local d=55+i*32;local kind=types[(i%3)+1]
        local size=kind=="jump" and Vector3.new(5,2.6,2) or kind=="slide" and Vector3.new(6,2,2) or Vector3.new(5,7,3)
        local y=kind=="slide" and 5.5 or size.Y/2
        local p=part(folder,"Obstacle_"..i,size,Vector3.new(lane*c.LaneWidth,y,-d),{68,93,82})
        if kind=="slide" then
            for _,side in ipairs({-1,1}) do part(folder,"Arch support",Vector3.new(.35,6,.5),Vector3.new(lane*c.LaneWidth+side*3.15,3,-d),{46,68,63}) end
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
