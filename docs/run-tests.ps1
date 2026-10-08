<#
  GeoQR Attend - automated API test runner (Person C)
  Usage:
    1) Start the backend from IntelliJ.
    2) In MySQL Workbench run docs/test-data.sql (resets attendance and events 2+),
       and make sure students 3 and 4 exist (see test-cases.md, Section 3).
    3) Run:  powershell -ExecutionPolicy Bypass -File docs\run-tests.ps1
  Works on Windows PowerShell 5.1 and PowerShell 7+.
  Test order matters: attendance is stateful.
#>

$Base    = "http://localhost:8080"
$Results = New-Object System.Collections.ArrayList
$Lat = 12.9716
$Lon = 77.5946

function Send-Api {
    param([string]$Method, [string]$Path, $Body = $null)
    $uri = "$Base$Path"
    try {
        $params = @{ Uri = $uri; Method = $Method; UseBasicParsing = $true }
        if ($Body) { $params.Body = ($Body | ConvertTo-Json); $params.ContentType = "application/json" }
        $r = Invoke-WebRequest @params
        $text = $r.Content
        if ($text -is [byte[]]) { $text = [Text.Encoding]::UTF8.GetString($text) }
        $json = $null
        try { $json = $text | ConvertFrom-Json } catch {}
        return @{ Code = [int]$r.StatusCode; Json = $json; Raw = $text; Type = "$($r.Headers['Content-Type'])" }
    }
    catch {
        $resp = $_.Exception.Response
        $code = 0
        if ($resp) { $code = [int]$resp.StatusCode }
        $text = $_.ErrorDetails.Message
        if (-not $text -and $resp) {
            try { $text = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd() } catch {}
        }
        $json = $null
        try { $json = $text | ConvertFrom-Json } catch {}
        return @{ Code = $code; Json = $json; Raw = $text; Type = "" }
    }
}

function Test-Case {
    param([string]$Id, [string]$Name, $Response, [int[]]$ExpectCode, [string]$ExpectErrorCode = "", [scriptblock]$Extra = $null)
    $ok = ($ExpectCode -contains $Response.Code)
    if ($ExpectErrorCode) { $ok = $ok -and ($Response.Json.errorCode -eq $ExpectErrorCode) }
    if ($ok -and $Extra)  { $ok = [bool](& $Extra $Response) }
    $got = "HTTP $($Response.Code)"
    if ($Response.Json -and $Response.Json.errorCode) { $got += " / $($Response.Json.errorCode)" }
    elseif ($Response.Json -and $Response.Json.status) { $got += " / $($Response.Json.status)" }
    [void]$Results.Add([pscustomobject]@{
        ID = $Id; Test = $Name
        Expected = ("HTTP " + ($ExpectCode -join " or ") + $(if ($ExpectErrorCode) { " / $ExpectErrorCode" } else { "" }))
        Actual = $got; Result = $(if ($ok) { "PASS" } else { "FAIL" })
    })
}

function Manual-Case {
    param([string]$Id, [string]$Name)
    [void]$Results.Add([pscustomobject]@{ ID = $Id; Test = $Name; Expected = "Check in client"; Actual = "-"; Result = "MANUAL" })
}

function Scan($eventId, $studentId, $lat, $lon, $device) {
    $b = @{ eventId = $eventId; studentId = $studentId; studentLat = $lat; studentLong = $lon; deviceId = $device }
    Send-Api -Method Post -Path "/api/scan" -Body $b
}

Write-Host "`nGeoQR Attend - API test run against $Base`n" -ForegroundColor Cyan

$pre = Send-Api Get "/api/events"
if ($pre.Code -ne 200) {
    Write-Host "Backend not reachable at $Base (HTTP $($pre.Code)). Start it in IntelliJ and try again." -ForegroundColor Red
    exit 2
}

# ---- 5.1 Authentication ---------------------------------------------------
$r = Send-Api Post "/api/auth/login" @{ email = "admin@geoqr.com"; password = "admin123"; role = "ADMIN" }
Test-Case "TC-01" "Valid administrator login" $r 200 "" { param($x) $x.Json.status -eq "SUCCESS" -and $x.Json.data.token -and $x.Json.data.user.role -eq "ADMIN" }

$r = Send-Api Post "/api/auth/login" @{ email = "student@geoqr.com"; password = "student123"; role = "STUDENT" }
Test-Case "TC-02" "Valid student login" $r 200 "" { param($x) $x.Json.status -eq "SUCCESS" -and $x.Json.data.token -and $x.Json.data.user.role -eq "STUDENT" }

$r = Send-Api Post "/api/auth/login" @{ email = "admin@geoqr.com"; password = "wrong"; role = "ADMIN" }
Test-Case "TC-03" "Wrong password" $r 404 "NOT_FOUND"

$r = Send-Api Post "/api/auth/login" @{ email = "admin@geoqr.com"; password = "admin123"; role = "STUDENT" }
Test-Case "TC-04" "Correct credentials, wrong role" $r 404 "NOT_FOUND"

# ---- 5.2 Event creation ---------------------------------------------------
# ADJUST these field names if they differ from CreateEventRequest.java in the backend.
$NewEvent = @{
    title        = "Automated Test Event"
    description  = "Created by run-tests.ps1"
    latitude     = $Lat
    longitude    = $Lon
    radiusMeters = 50
    eventDate    = (Get-Date).ToString("yyyy-MM-dd")
    startTime    = "10:00:00"
    endTime      = "11:00:00"
    createdBy    = 1
}
$r = Send-Api Post "/api/events" $NewEvent
Test-Case "TC-05" "Create an event with valid data" $r @(200, 201) "" { param($x) $x.Json.status -eq "SUCCESS" -and $x.Json.data.id }
$newId = $null
if ($r.Json -and $r.Json.data) { $newId = $r.Json.data.id }

if ($newId) { $r = Send-Api Get "/api/events/$newId" } else { $r = @{ Code = 0; Json = $null; Raw = ""; Type = "" } }
Test-Case "TC-06" "Retrieve the created event" $r 200 "" { param($x) $x.Json.data.title -eq "Automated Test Event" }

$r = Send-Api Get "/api/events"
Test-Case "TC-07" "List all events" $r 200 "" { param($x) $ids = @($x.Json.data | ForEach-Object { [int]$_.id }); ($ids -contains 1) -and ($ids -contains [int]$newId) }

# ---- 5.3 QR code ----------------------------------------------------------
Manual-Case "TC-08" "QR code generated for a new event (client)"

$r = Scan 99999 2 $Lat $Lon "dev-Z"
Test-Case "TC-09" "QR code with an unknown event identifier" $r 404 "NOT_FOUND"

# ---- 5.4 Location (order matters) ----------------------------------------
$r = Scan 1 2 $Lat $Lon "dev-A"
Test-Case "TC-10" "Valid scan at the event location" $r 200 "" { param($x) $x.Json.data.status -eq "PRESENT" -and [math]::Abs($x.Json.data.distanceMeters) -lt 0.5 }

$r = Scan 1 4 12.97200 $Lon "dev-C"
Test-Case "TC-11" "Boundary: 44.48 m is inside 50 m" $r 200 "" { param($x) $x.Json.data.status -eq "PRESENT" -and [math]::Abs($x.Json.data.distanceMeters - 44.48) -lt 0.5 }

$r = Scan 1 3 12.97210 $Lon "dev-B"
Test-Case "TC-12" "Boundary: 55.60 m is outside 50 m" $r 400 "LOCATION_MISMATCH"

$r = Scan 1 3 12.9761 $Lon "dev-B"
Test-Case "TC-13" "Far away, north (500 m)" $r 400 "LOCATION_MISMATCH" { param($x) $x.Json.message -like "*500m*" }

$r = Scan 1 3 $Lat 77.5996 "dev-B"
Test-Case "TC-14" "Far away, east (542 m)" $r 400 "LOCATION_MISMATCH"

# ---- 5.5 Proxy and duplicate ----------------------------------------------
$r = Scan 1 3 $Lat $Lon "dev-A"
Test-Case "TC-15" "Same device, different student" $r 400 "PROXY_ATTENDANCE" { param($x) $x.Json.message -like "*Proxy detected*" }

$r = Scan 1 2 $Lat $Lon "dev-X"
Test-Case "TC-16" "Same student scans twice" $r 400 "PROXY_ATTENDANCE" { param($x) $x.Json.message -like "*already marked*" }

$r = Scan 1 2 12.9761 $Lon "dev-Y"
Test-Case "TC-17" "Duplicate check precedes location check" $r 400 "PROXY_ATTENDANCE" { param($x) $x.Json.message -like "*already marked*" }

$r = Scan 3 4 $Lat $Lon "dev-A"
Test-Case "TC-18" "Device reuse at a different event is allowed" $r 200 "" { param($x) $x.Json.data.status -eq "PRESENT" }

# ---- 5.6 Analytics --------------------------------------------------------
$r = Send-Api Get "/api/analytics/at-risk"
Test-Case "TC-19" "At-risk students are identified" $r 200 "" { param($x) $ids = @($x.Json.data | ForEach-Object { [int]$_.id }); ($ids -contains 3) -and ($ids -contains 4) -and (-not ($ids -contains 2)) }

$r = Send-Api Get "/api/analytics/trend"
Test-Case "TC-20" "Attendance trend" $r 200 "" { param($x) @($x.Json.data).Count -ge 5 -and $x.Json.data[0].date -and ($null -ne $x.Json.data[0].count) }

$r = Send-Api Get "/api/attendance/count/1"
Test-Case "TC-21" "Attendance count for event 1 equals 2" $r 200 "" { param($x) [int]$x.Json.data -eq 2 }

# ---- 5.7 Reports ----------------------------------------------------------
$r = Send-Api Get "/api/reports/csv"
Test-Case "TC-22" "CSV report download" $r 200 "" { param($x) $x.Type -like "*text/csv*" -and $x.Raw -like "ID,Event ID*" }

Test-Case "TC-23" "CSV report contains this run's records" $r 200 "" { param($x) $x.Raw -like "*dev-A*" -and $x.Raw -like "*dev-C*" }

$r = Send-Api Get "/api/reports/pdf"
Test-Case "TC-24" "PDF report endpoint responds" $r 200 "" { param($x) $x.Type -like "*application/pdf*" }

Test-Case "TC-25" "PDF report is a valid PDF file (known issue K-1)" $r 200 "" { param($x) "$($x.Raw)".StartsWith("%PDF") }

# ---- Summary --------------------------------------------------------------
$Results | Format-Table ID, Test, Expected, Actual, Result -AutoSize

$auto   = @($Results | Where-Object Result -ne "MANUAL")
$pass   = @($auto | Where-Object Result -eq "PASS").Count
$fail   = @($auto | Where-Object Result -eq "FAIL").Count
$manual = @($Results | Where-Object Result -eq "MANUAL").Count
$color = "Green"; if ($fail -gt 0) { $color = "Yellow" }
Write-Host "Automated: $pass passed, $fail failed. Manual cases to perform: $manual." -ForegroundColor $color

Write-Host "`nRows to copy (ID | Actual | Status):" -ForegroundColor Cyan
$Results | ForEach-Object { "| {0} | {1} | {2} |" -f $_.ID, $_.Actual, $_.Result }

$out = Join-Path $PSScriptRoot "test-results.csv"
$Results | Export-Csv -Path $out -NoTypeInformation
Write-Host "`nSaved results to $out" -ForegroundColor DarkGray

if ($fail -gt 0) { exit 1 }