const MachinesTable = ({
  displayedMachines,
  searchTerm,
  currentPage,
  pageSize,
  encryptedIds,
  loadingEncryptedIds,
  getEncryptedMachineId,
  qrUrls,
  loadingQrCodes,
  getQrCode,
  handleViewQr,
  deviceStatuses,
  loadingDeviceStatus,
  getDeviceStatus,
  handlePlanograms,
  handleToggleMachine,
  handleSyncMachine,
  isSync,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-xs">
          {/* Head */}
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <tr>
              <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                ID
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                Encrypted Machine ID
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code
                </div>
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                Friendly Name
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Venue
                </div>
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                Device ID
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                Device Name
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">
                <div className="flex items-center gap-2">Action</div>
              </th>
            </tr>
          </thead>
          {/* Body */}
          <tbody className="divide-y divide-gray-200">
            {displayedMachines.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">
                    {searchTerm.trim()
                      ? "No machines found matching your search"
                      : "No machines found"}
                  </p>
                </td>
              </tr>
            ) : (
              displayedMachines.map((machine, index) => (
                <tr
                  key={machine.id}
                  // onClick={() => handleRowClick(machine)} // keep but do not enable row click
                  className={`${
                    machine.id == 11233
                      ? "bg-red-200 text-white hover:bg-red-400" // red background + white text for visibility
                      : index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                  } hover:bg-blue-100 transition-colors duration-200 cursor-pointer`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                        {index + 1 + (currentPage - 1) * pageSize}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {machine.id}
                      </span>
                    </div>
                  </td>

                  {/* Encrypted ID Column */}
                  <td className="px-2 py-2 text-[11px]">
                    {encryptedIds[machine.id] ? (
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold hover:bg-green-200">
                        {encryptedIds[machine.id]}
                      </span>
                    ) : (
                      <button
                        className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium hover:bg-red-200"
                        type="button"
                        disabled={loadingEncryptedIds[machine.id]}
                        onClick={() => getEncryptedMachineId(machine.id)}
                      >
                        {loadingEncryptedIds[machine.id] ? "Loading..." : "GET"}
                      </button>
                    )}
                  </td>

                  {/* QR Code Column */}
                  <td className="px-2 py-2 text-[11px]">
                    {qrUrls[machine.id] ? (
                      <button
                        className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium hover:bg-blue-200 flex items-center gap-1"
                        type="button"
                        onClick={() => handleViewQr(machine)}
                      >
                        View
                      </button>
                    ) : (
                      <button
                        className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-medium hover:bg-orange-200"
                        type="button"
                        disabled={loadingQrCodes[machine.id]}
                        onClick={() => getQrCode(machine.id)}
                      >
                        {loadingQrCodes[machine.id] ? "Loading..." : "GET"}
                      </button>
                    )}
                  </td>

                  {/* Friendly Name */}
                  <td className="px-2 py-2 text-[11px]">
                    <div className="font-medium text-gray-900">
                      {machine.friendlyName || "N/A"}
                    </div>
                  </td>

                  {/* Venue */}
                  <td className="px-2 py-2 text-[11px]">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                        machine.venue
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {machine.venue?.name || "Not Set"}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-2 py-2 text-[11px]">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                        machine.location
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {machine.location?.description || "Not Set"}
                    </span>
                  </td>

                  {/* Device ID */}
                  <td className="px-2 py-2 text-[11px] whitespace-nowrap">
                    <div className="text-gray-900">
                      {machine.maxItemsPerDevice?.[0]?.deviceId || "N/A"}
                    </div>
                  </td>

                  {/* Device Name */}
                  <td className="px-2 py-2 text-[11px]">
                    <div className="font-medium text-gray-900">
                      {machine.maxItemsPerDevice?.[0]?.deviceName || "N/A"}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-2 text-[11px]">
                    <div className="flex flex-col gap-2">
                      {/* VendLive Status */}
                      {deviceStatuses[machine.id] !== undefined ? (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                            deviceStatuses[machine.id]
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {deviceStatuses[machine.id] ? (
                            <>
                              <Power className="h-3 w-3 mr-1" />
                              Enabled
                            </>
                          ) : (
                            <>
                              <PowerOff className="h-3 w-3 mr-1" />
                              Disabled
                            </>
                          )}
                        </span>
                      ) : (
                        <button
                          className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 font-medium hover:bg-gray-200"
                          type="button"
                          disabled={loadingDeviceStatus[machine.id]}
                          onClick={() => getDeviceStatus(machine.id)}
                        >
                          {loadingDeviceStatus[machine.id]
                            ? "Loading..."
                            : "Check Status"}
                        </button>
                      )}

                      {/* Planograms Button (NEW) */}
                      <button
                        className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] hover:bg-blue-200"
                        onClick={() => handlePlanograms(machine)}
                      >
                        Planograms
                      </button>

                      {/* Enable/Disable Button */}
                      <button
                        className={`px-2 py-1 rounded-full font-medium flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200`}
                        onClick={() => handleToggleMachine(machine)}
                      >
                        <>
                          <Power className="h-3 w-3" />
                          Enable/Disable
                        </>
                      </button>

                      {/* Sync Button */}
                      <button
                        className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium hover:bg-yellow-200 flex items-center gap-1"
                        onClick={() => handleSyncMachine(machine.id)}
                        disabled={isSync[machine.id]}
                      >
                        <RefreshCcw className="h-3 w-3" />
                        {isSync[machine.id] ? "Syncing..." : "Sync"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MachinesTable;
