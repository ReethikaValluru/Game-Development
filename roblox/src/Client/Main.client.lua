local Players=game:GetService("Players")
local RS=game:GetService("ReplicatedStorage")
local RunService=game:GetService("RunService")
local CAS=game:GetService("ContextActionService")
local SoundService=game:GetService("SoundService")
local player=Players.LocalPlayer
local shared=RS:WaitForChild("Sapiens")
local c=require(shared.Config)
local action=shared:WaitForChild("Action")
local update=shared:WaitForChild("State")
local state={mode="loading",collected={}}
local muted=false
local gui=Instance.new("ScreenGui");gui.Name="SapiensHUD";gui.ResetOnSpawn=false;gui.Parent=player:WaitForChild("PlayerGui")
local function label(parent,text,size,pos)
    local l=Instance.new("TextLabel");l.BackgroundTransparency=1;l.Size=size;l.Position=pos
    l.Text=text;l.Font=Enum.Font.Gotham;l.TextSize=16;l.TextColor3=Color3.fromRGB(218,238,225);l.TextWrapped=true;l.Parent=parent;return l
end
local function button(parent,text,size,pos,callback)
    local b=Instance.new("TextButton");b.Text=text;b.Size=size;b.Position=pos;b.Font=Enum.Font.GothamBold;b.TextSize=15
    b.BackgroundColor3=Color3.fromRGB(34,83,72);b.TextColor3=Color3.fromRGB(224,242,231);b.Parent=parent
    local round=Instance.new("UICorner");round.CornerRadius=UDim.new(0,10);round.Parent=b
    b.Activated:Connect(callback);return b
end
local bar=Instance.new("Frame");bar.Size=UDim2.new(1,0,0,94);bar.BackgroundColor3=Color3.fromRGB(8,26,31);bar.BackgroundTransparency=.1;bar.Parent=gui
local status=label(bar,"Loading the forest…",UDim2.new(1,-170,0,45),UDim2.fromOffset(10,0))
local progress=label(bar,"",UDim2.new(1,-20,0,42),UDim2.fromOffset(10,45));progress.TextSize=13
button(bar,"Pause",UDim2.fromOffset(70,38),UDim2.new(1,-160,0,5),function()action:FireServer(state.mode=="paused" and "resume" or "pause")end)
local music=Instance.new("Sound");music.Name="ForestDrone";music.Looped=true;music.Volume=.42;music.Parent=SoundService
if c.Audio.Music>0 then music.SoundId="rbxassetid://"..c.Audio.Music end
local muteButton
muteButton=button(bar,"Sound on",UDim2.fromOffset(78,38),UDim2.new(1,-82,0,5),function()
    muted=not muted;music.Volume=muted and 0 or .42;muteButton.Text=muted and "Muted" or "Sound on"
end)
local panel=Instance.new("Frame");panel.AnchorPoint=Vector2.new(.5,.5);panel.Position=UDim2.fromScale(.5,.5);panel.Size=UDim2.new(.9,0,.62,0)
panel.BackgroundColor3=Color3.fromRGB(8,30,34);panel.Parent=gui
local limit=Instance.new("UISizeConstraint");limit.MaxSize=Vector2.new(600,430);limit.Parent=panel
local title=label(panel,c.Title,UDim2.new(1,-30,.18,0),UDim2.fromOffset(15,5));title.TextSize=22;title.Font=Enum.Font.GothamBold
local body=label(panel,"",UDim2.new(1,-30,.43,0),UDim2.new(0,15,.18,0));body.TextSize=15
local primary=button(panel,"Enter the forest",UDim2.new(1,-30,.15,0),UDim2.new(0,15,.65,0),function()
    if state.mode=="story" then action:FireServer("answer",1)
    elseif state.mode=="paused" then action:FireServer("resume")
    else action:FireServer("start") end
end)
local secondary=button(panel,"Trust happens automatically",UDim2.new(1,-30,.15,0),UDim2.new(0,15,.82,0),function()
    body.Text="Consider the alternative: strangers do not automatically trust each other. In Sapiens, shared stories are one explanation for cooperation. Try the shared-symbol choice."
end)
local controls=Instance.new("Frame");controls.BackgroundTransparency=1;controls.Size=UDim2.new(1,-20,0,55);controls.Position=UDim2.new(0,10,1,-65);controls.Parent=gui
for i,item in ipairs({{"Left","left"},{"Jump","jump"},{"Slide","slide"},{"Right","right"}}) do
    local verb=item[2]
    button(controls,item[1],UDim2.new(.24,0,1,0),UDim2.fromScale((i-1)*.253,0),function()action:FireServer(verb)end)
end
local bindings={left={Enum.KeyCode.A,Enum.KeyCode.Left,Enum.KeyCode.DPadLeft},right={Enum.KeyCode.D,Enum.KeyCode.Right,Enum.KeyCode.DPadRight},jump={Enum.KeyCode.Space,Enum.KeyCode.W,Enum.KeyCode.ButtonA},slide={Enum.KeyCode.S,Enum.KeyCode.Down,Enum.KeyCode.ButtonB}}
for verb,keys in pairs(bindings) do
    CAS:BindActionAtPriority("Sapiens_"..verb,function(_,inputState)
        if inputState==Enum.UserInputState.Begin then action:FireServer(verb) end
        return Enum.ContextActionResult.Sink
    end,false,3000,table.unpack(keys))
end
local function effect(name)
    local id=c.Audio[name];if muted or not id or id<=0 then return end
    local sound=Instance.new("Sound");sound.SoundId="rbxassetid://"..id;sound.Volume=.35;sound.Parent=SoundService;sound:Play()
    game:GetService("Debris"):AddItem(sound,8)
end
update.OnClientEvent:Connect(function(s)
    state=s
    status.Text=string.format("FOREST OF STORIES   •   %dm   •   Impacts %d/2",s.distance,s.hits)
    progress.Text=string.format("Supplies %d/%d   |   Insight %s   |   Best %dm   |   %s",s.supplies,c.SuppliesRequired,s.insight and "✓" or "0/1",s.best,s.saveStatus or "Session")
    panel.Visible=s.mode~="running";secondary.Visible=s.mode=="story";primary.Visible=s.mode~="dead" and s.mode~="loading"
    controls.Visible=s.mode=="running"
    if s.mode=="loading" then title.Text="Entering the forest";body.Text="Loading your saved discoveries…"
    elseif s.mode=="ready" then
        title.Text=c.Title;primary.Text="Enter the forest"
        body.Text="Run the ancient trail. Gather 8 supplies, discover an idea, and reach 900m. Two obstacle impacts cause death and automatic respawn. A/D: lanes • Space: jump logs • S: slide under arches. Dodge standing stones. Touch controls below."
        if c.Audio.Music==0 then body.Text=body.Text.."\nAudio awaits asset IDs; see the setup guide." end
    elseif s.mode=="story" then
        title.Text="Quest: The painted cave";primary.Text="Create a shared symbol and story"
        body.Text="Two unfamiliar bands reach the same shelter. What might help them cooperate?\nSapiens explores shared stories as one basis for large-scale cooperation. This is a book-inspired interpretation, not a universal historical law. Choose a response to gain +12 knowledge once."
    elseif s.mode=="dead" then title.Text="Your journey falters";body.Text="Two impacts. Returning to the starting point… Your supplies and insight are retained."
    elseif s.mode=="paused" then title.Text="Rest beside the trail";body.Text="Your run is paused. No movement or collisions while this panel is open.";primary.Text="Resume"
    elseif s.mode=="complete" then title.Text="Chapter complete";body.Text="You reached the end, gathered supplies and discovered an idea. This starter contains the Cognitive chapter only. Your best distance, insight and completed-run count can be saved.";primary.Text="Play again"
    elseif s.mode=="return" then title.Text="One more journey";body.Text="Reach the arch with 8 supplies and the story insight. Return to collect the supplies you missed. Your progress is retained.";primary.Text="Return to the start" end
    if s.event=="Death" then effect("Hit") else effect(s.event) end
    if c.Audio.Music>0 then
        if s.mode=="running" and not music.IsPlaying then music:Resume();if not music.IsPlaying then music:Play() end
        elseif s.mode~="running" then music:Pause() end
    end
    local world=workspace:FindFirstChild("SapiensForest")
    if world then
        for _,p in ipairs(world:GetChildren()) do
            local id=tonumber(string.match(p.Name,"^Supply_(%d+)$"))
            if id then p.LocalTransparencyModifier=(s.collected[id] or s.collected[tostring(id)]) and 1 or 0 end
        end
    end
end)
local joints={}
local function prepareCharacter(model)
    joints={}
    for _,joint in ipairs(model:GetDescendants()) do
        if joint:IsA("Motor6D") and (string.find(joint.Name,"Hip") or string.find(joint.Name,"Shoulder")) then table.insert(joints,joint) end
    end
end
player.CharacterAdded:Connect(prepareCharacter)
if player.Character then prepareCharacter(player.Character) end
RunService.RenderStepped:Connect(function(dt)
    local camera=workspace.CurrentCamera
    local root=player.Character and player.Character:FindFirstChild("HumanoidRootPart")
    if root then
        camera.CameraType=Enum.CameraType.Scriptable
        local target=root.Position
        camera.CFrame=camera.CFrame:Lerp(CFrame.lookAt(target+Vector3.new(0,9,17),target+Vector3.new(0,2,-18)),1-math.exp(-dt*8))
        for _,joint in ipairs(joints) do
            local side=string.find(joint.Name,"Left") and -1 or 1
            joint.Transform=CFrame.Angles(state.mode=="running" and math.sin(os.clock()*10)*.5*side or 0,0,0)
        end
    end
end)
action:FireServer("sync")
