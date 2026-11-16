-- Pure Lua/Luau module. No Roblox services, suitable for deterministic tests.
local Rules = {}
function Rules.new()
    return { distance=0, x=0, lane=0, hits=0, supplies=0, knowledge=0,
        jump=0, slide=0, mode="ready", insight=false, collected={}, struck={},
        best=0, wins=0, storySeen=false }
end
function Rules.respawn(s)
    s.distance=0; s.x=0; s.lane=0; s.hits=0; s.jump=0; s.slide=0
    s.struck={}; s.mode="running"
end
function Rules.input(s, action, c)
    if s.mode~="running" then return false end
    if action=="left" then s.lane=math.max(-1,s.lane-1)
    elseif action=="right" then s.lane=math.min(1,s.lane+1)
    elseif action=="jump" and s.jump==0 and s.slide==0 then s.jump=c.JumpDuration
    elseif action=="slide" and s.jump==0 and s.slide==0 then s.slide=c.SlideDuration
    else return false end
    return true
end
function Rules.height(s,c)
    if s.jump<=0 then return 0 end
    return math.sin(math.pi*(1-s.jump/c.JumpDuration))*c.JumpHeight
end
function Rules.hit(s,id)
    if s.mode~="running" or s.struck[id] then return false end
    s.struck[id]=true; s.hits=s.hits+1
    if s.hits>=2 then s.mode="dead" end
    return true
end
function Rules.collect(s,id)
    if s.mode~="running" or s.collected[id] then return false end
    s.collected[id]=true; s.supplies=s.supplies+1
    return true
end
function Rules.answer(s,choice)
    if s.mode~="story" or choice~=1 then return false end
    if not s.insight then s.insight=true; s.knowledge=s.knowledge+12 end
    s.storySeen=true; s.mode="running"
    return true
end
function Rules.step(s,dt,c,obstacles,supplies)
    if s.mode~="running" then return nil end
    dt=math.min(math.max(dt,0),0.05)
    local before=s.distance
    s.distance=math.min(c.Length,s.distance+c.Speed*dt)
    s.best=math.max(s.best,math.floor(s.distance))
    s.x=s.x+(s.lane*c.LaneWidth-s.x)*math.min(1,dt*14)
    s.jump=math.max(0,s.jump-dt); s.slide=math.max(0,s.slide-dt)
    local event=nil
    for _,o in ipairs(obstacles) do
        if before<=o.d+2 and s.distance>=o.d-2 and math.abs(s.x-o.lane*c.LaneWidth)<2.5 then
            local safe=(o.kind=="jump" and Rules.height(s,c)>3) or (o.kind=="slide" and s.slide>0)
            if not safe and Rules.hit(s,o.id) then event="Hit" end
        end
    end
    if s.mode=="dead" then return "Death" end
    for _,p in ipairs(supplies) do
        if before<=p.d+2 and s.distance>=p.d-2 and math.abs(s.x-p.lane*c.LaneWidth)<2.8 then
            if Rules.collect(s,p.id) then event=event or "Pickup" end
        end
    end
    if s.distance>=180 and not s.storySeen then s.mode="story";return "Story" end
    if s.distance>=c.Length then
        if s.supplies>=c.SuppliesRequired and s.insight then s.mode="complete";s.wins=s.wins+1;return "Complete" end
        s.mode="return";return "Return"
    end
    return event
end
return Rules
