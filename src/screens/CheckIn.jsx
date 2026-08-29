import { Screen, TopBar, Body, Note } from '../components/ui.jsx'
import { Qr, Nfc, Hand, Chevron } from '../components/Icons.jsx'

/* SCREEN 4A - Check-In.

   Ordered fastest-first, with Manual deliberately demoted. The venue already
   has a manual queue board and it has failed: "there's a [queue board] but no
   one uses it because it's like lazy" - and the marker was dead, "it's dry
   out, it's got no ink left". Asked what would work instead: "With a QR code
   or ... tap your phone again - it would be nice." (21 Aug, arcade)

   So the design bet is that check-in has to be one tap or it will not happen. */
export default function CheckIn({ arcade, onBack, onScan, onManual }) {
  return (
    <Screen>
      <TopBar title="Check-In" onBack={onBack} />

      <Body>
        <div className="border-b border-gray-300 px-4 py-3">
          <p className="text-sm text-gray-900">{arcade.name}</p>
          <p className="text-xs text-gray-600">
            Joining the queue puts you in the running order everyone can see.
          </p>
        </div>

        <Option
          Icon={Qr}
          title="Scan QR"
          hint="Fastest — point the camera at the sticker on the cabinet"
          onClick={() => onScan('qr')}
        />
        <Option
          Icon={Nfc}
          title="Tap NFC"
          hint="Hold your phone against the reader on the cabinet"
          onClick={() => onScan('nfc')}
        />
        <Option
          Icon={Hand}
          title="Manual"
          hint="Fallback — type in your position by hand"
          muted
          onClick={onManual}
        />

        <div className="space-y-2 px-4 py-4">
          <Note>
            Manual is kept only as a fallback for a broken sticker or a phone
            without NFC. The paper queue board in the arcade already proves that
            anything slower than one tap gets skipped.
          </Note>
        </div>
      </Body>
    </Screen>
  )
}

function Option({ Icon, title, hint, muted, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-gray-300 px-4 py-4 text-left"
    >
      <span className={muted ? 'text-gray-500' : 'text-gray-900'}>
        <Icon size={22} />
      </span>
      <span className="flex-1">
        <span
          className={`block text-sm font-semibold ${
            muted ? 'text-gray-600' : 'text-gray-900'
          }`}
        >
          {title}
        </span>
        <span className="block text-xs text-gray-600">{hint}</span>
      </span>
      <Chevron size={16} />
    </button>
  )
}
