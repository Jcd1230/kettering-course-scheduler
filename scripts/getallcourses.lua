local http = require "socket.http"
local ltn12 = require "ltn12"

local sink, source = ltn12.sink, ltn12.source
local resp = {}
local respf = io.open("test.html","w")
local login_reqbody = [[sid=doga8155&PIN=58627734]]

local headers = {
	["Cookie"] = "TESTID=set; accessibility=false; sghe_magellan_username=; sghe_magellan_locale=en_US",
	["Content-type"] = "application/x-www-form-urlencoded",
	["Content-length"] = ""..#login_reqbody
}


local login_url = "https://jweb.kettering.edu/cku1/twbkwbis.P_ValLogin"
local course_url = "https://jweb.kettering.edu/cku1/bwskfcls.P_GetCrse"
local majors = [[ACCT,BINF,BIOL,BUSN,CHME,CHEM,CHN,COMM,CE,CS,CUE,ECON,ECE,EE,FINC,FYE,GER,HIST,HUMN,IME,ISYS,INEN,MFGO,LS,LIT,MGMT...]]

local r, c, h = http.request {
	url = login_url,
	method = "POST",
	source = source.simplify(source.string(login_reqbody)),
	sink = sink.simplify(sink.table(login_resp)),--sink.table(resp)),
	headers = headers
}

local cookies = h["set-cookie"];

local reqbody = [[rsts=dummy&crn=dummy&term_in=201503&sel_subj=dummy&sel_day=dummy&sel_schd=dummy&sel_insm=dummy&sel_camp=dummy&sel_levl=dummy&sel_sess=dummy&sel_instr=dummy&sel_ptrm=dummy&sel_attr=dummy&sel_subj=ACCT&sel_subj=BINF&sel_subj=BIOL&sel_subj=BUSN&sel_subj=CHME&sel_subj=CHEM&sel_subj=CHN&sel_subj=COMM&sel_subj=CE&sel_subj=CS&sel_subj=CUE&sel_subj=ECON&sel_subj=ECE&sel_subj=EE&sel_subj=FINC&sel_subj=FYE&sel_subj=GER&sel_subj=HIST&sel_subj=HUMN&sel_subj=IME&sel_subj=ISYS&sel_subj=INEN&sel_subj=MFGO&sel_subj=LS&sel_subj=LIT&sel_subj=MGMT&sel_subj=MRKT&sel_subj=MATH&sel_subj=MECH&sel_subj=MEDI&sel_subj=PHIL&sel_subj=PHYS&sel_subj=SSCI&sel_subj=SOC&sel_crse=&sel_title=&sel_from_cred=&sel_to_cred=&sel_ptrm=%25&begin_hh=0&begin_mi=0&end_hh=0&end_mi=0&begin_ap=x&end_ap=y&path=1&SUB_BTN=Course+Search&SUB_BTN=Course+Search]]

headers["Cookie"] = cookies
headers["Content-length"] = ""..#reqbody

r, c, h = http.request {
	url = course_url,
	method = "POST",
	source = source.simplify(source.string(reqbody)),
	sink = sink.simplify(sink.table(resp)),--sink.file(respf)),
	headers = headers
}

local course_page = table.concat(resp)

--print(course_page)

course_page = course_page:gsub("<input[^>]*>","")
course_page = course_page:gsub("\n\n","")

local majors = {}
local majorname = {}

for section in course_page:gmatch([["ddheader".-TH CLASS=]]) do
	local classes = {}
	local name, abbr = section:match("16px;\">([^%(<]+)([^%)<]*)")
	
	name = name:gsub(" $", "")
	if not abbr or abbr == "" then
		abbr = name:gsub("[^A-Z]","")
	else
		abbr = abbr:gsub("%(","")
	end
	
	print("["..name.."]", "("..abbr..")")
	
	majors[abbr] = classes
	majorname[abbr] = name
	
	for num, title in section:gmatch([[width="10%%">([^<]+)<.-align="left">([^<]+)]]) do
		classes[num] = title
	end
end

for major, classes in pairs(majors) do
	print("",'{ "'..major..'", "'..majorname[major]:upper()..'" },')
	for num, title in pairs(classes) do
		print(major .. "-" .. num, title)
	end
end

respf:write(course_page)
respf:close()
