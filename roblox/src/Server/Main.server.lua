local Players=game:GetService("Players")
local RS=game:GetService("ReplicatedStorage")
local RunService=game:GetService("RunService")
local shared=RS:WaitForChild("Sapiens")
local Config=require(shared.Config)
local Rules=require(shared.Rules)
local obstacles,supplies=require(script.Parent.World).build(Config)
Players.RespawnTime=Config.RespawnSeconds
local action=Instance.new("RemoteEvent");action.Name="Action";action.Parent=shared
local update=Instance.new("RemoteEvent");update.Name="State";update.Parent=shared
local sessions={}
local store=nil
if not RunService:IsStudio() or Config.EnableStudioSaves then
    local ok,value=pcall(function()return game:GetService("DataStoreService"):GetDataStore(Config.DataStoreName) end)
    if ok then store=value end
end
local function snapshot(player,s,event)
    local collected={}
    for id in pairs(s.collected) do collected[tostring(id)]=true end
    update:FireClient(player,{mode=s.mode,hits=s.hits,distance=math.floor(s.distance),supplies=s.supplies,
        knowledge=s.knowledge,insight=s.insight,best=s.best,wins=s.wins,event=event,
        saveStatus=s.saveStatus,collected=collected})
end
local function save(player,s)
    if not store or not s.canSave or s.saving then return end
    s.saving=true
    local best,wins,insight=s.best,s.wins,s.insight
    local ok=pcall(function()
        store:UpdateAsync(tostring(player.UserId),function(old)
            old=type(old)=="table" and old or {}
            return {version=1,best=math.max(tonumber(old.best) or 0,best),
                wins=math.max(tonumber(old.wins) or 0,wins),insight=old.insight==true or insight}
        end)
    end)
    s.saveStatus=ok and "Saved" or "Save failed; will retry";s.saving=false
end
local function character(player,model)
    local root=model:WaitForChild("HumanoidRootPart",10)
    local humanoid=model:WaitForChild("Humanoid",10)
    local s=sessions[player];if not s or not root or not humanoid then return end
    root.Anchored=true;humanoid.AutoRotate=false;humanoid.WalkSpeed=0;humanoid.JumpPower=0
    for _,p in ipairs(model:GetDescendants()) do if p:IsA("BasePart") then p.CanCollide=false end end
    model.PrimaryPart=root
    local animate=model:FindFirstChild("Animate");if animate then animate.Disabled=true end
    s.root=root;s.humanoid=humanoid;s.character=model
    if s.mode=="dead" then Rules.respawn(s) end
    model:PivotTo(CFrame.new(0,3,0))
    humanoid.Died:Connect(function()if sessions[player] then s.mode="dead";snapshot(player,s,"Death") end end)
    snapshot(player,s)
end
local function join(player)
    local s=Rules.new();s.lastInput=0;s.report=0;s.canSave=false;s.saveStatus=store and "Loading save" or "Session only (Studio saves off)"
    if store then s.mode="loading" end
    sessions[player]=s
    player.CharacterAdded:Connect(function(model)character(player,model)end)
    if player.Character then task.spawn(character,player,player.Character) end
    if store then
        local ok,data=pcall(function()return store:GetAsync(tostring(player.UserId))end)
        if sessions[player]~=s then return end
        if ok then
            if type(data)=="table" and data.version==1 then
                s.best=math.max(s.best,math.min(900,tonumber(data.best) or 0));s.wins=math.max(0,tonumber(data.wins) or 0)
                s.insight=data.insight==true or s.insight;s.knowledge=s.insight and 12 or 0
            end
            s.canSave=true;s.saveStatus="Save ready"
        else s.canSave=false;s.saveStatus="Save unavailable; session progress only" end
        if s.mode=="loading" then s.mode="ready" end
        snapshot(player,s)
    end
end
Players.PlayerAdded:Connect(join)
for _,p in ipairs(Players:GetPlayers()) do task.spawn(join,p) end
Players.PlayerRemoving:Connect(function(p)local s=sessions[p];if s then save(p,s) end;sessions[p]=nil end)
action.OnServerEvent:Connect(function(player,verb,value)
    local s=sessions[player]
    if not s or type(verb)~="string" then return end
    local now=os.clock();if now-s.lastInput<.07 then return end;s.lastInput=now
    if verb=="sync" then snapshot(player,s);return end
    if verb=="start" and s.root and s.humanoid.Health>0 and (s.mode=="ready" or s.mode=="return" or s.mode=="complete") then
        if s.mode=="complete" then s.supplies=0;s.collected={};s.storySeen=false end
        Rules.respawn(s)
    elseif verb=="pause" and s.mode=="running" then s.mode="paused"
    elseif verb=="resume" and s.mode=="paused" then s.mode="running"
    elseif verb=="answer" then
        if Rules.answer(s,value) then snapshot(player,s,"Discovery");task.spawn(save,player,s);return end
    else Rules.input(s,verb,Config) end
    snapshot(player,s)
end)
RunService.Heartbeat:Connect(function(dt)
    for p,s in pairs(sessions) do
        if s.root and s.root.Parent and s.humanoid.Health>0 then
            local event=Rules.step(s,dt,Config,obstacles,supplies)
            if s.mode=="dead" then s.humanoid.Health=0
            else
                local h=Rules.height(s,Config)
                local sliding=s.slide>0
                s.character:PivotTo(CFrame.new(s.x,sliding and 1.35 or 3+h,-s.distance)*CFrame.Angles(sliding and -math.pi/2 or 0,0,0))
            end
            s.report=s.report+dt
            if event or s.report>.1 then s.report=0;snapshot(p,s,event) end
            if event=="Complete" then task.spawn(save,p,s) end
        end
    end
end)
task.spawn(function()while task.wait(60) do for p,s in pairs(sessions) do task.spawn(save,p,s) end end end)
game:BindToClose(function()
    local pending=0
    for p,s in pairs(sessions) do pending=pending+1;task.spawn(function()save(p,s);pending=pending-1 end) end
    local untilTime=os.clock()+25;while pending>0 and os.clock()<untilTime do task.wait(.1) end
end)
