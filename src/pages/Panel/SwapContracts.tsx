import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
// import { BigNumber } from '@ethersproject/bignumber'
import { Box } from 'rebass'
import { Label, Checkbox } from '@rebass/forms'
import { useActiveWeb3React } from 'hooks'
import { useProjectInfo } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useTranslation } from 'react-i18next'
import { ButtonPrimary } from 'components/Button'
import AddressInputPanel from 'components/AddressInputPanel'
import QuestionHelper from 'components/QuestionHelper'
import InputPanel from 'components/InputPanel'
import { isValidAddress, setFactoryOption, getFactoryOptions } from 'utils/contract'
import { ZERO_ADDRESS } from 'sdk'
import { factoryMethods } from '../../constants'

const OptionWrapper = styled.div<{ margin?: number }>`
  margin: ${({ margin }) => margin || 0.2}rem 0;
  padding: 0.3rem 0;
`

const Info = styled.p`
  padding: 0.4rem;
  font-size: 0.9rem;
  opacity: 0.6;
`

const LabelExtended = styled(Label)`
  display: flex;
  align-items: center;
`

const InputWrapper = styled.div`
  margin: 0.2rem 0;
`

const Button = styled(ButtonPrimary)`
  padding: 0.8rem;
  margin-top: 0.3rem;
  font-size: 0.8em;
`

const InputLabel = styled.div`
  display: flex;
  align-items: center;
`

export default function SwapContracts(props: any) {
  const { pending, setPending, setError } = props
  const { t } = useTranslation()
  const { library, account, chainId } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()
  const { factory: stateFactory } = useProjectInfo()
  const [factory, setFactory] = useState(stateFactory || '')
  const [factoryIsCorrect, setFactoryIsCorrect] = useState(false)

  useEffect(() => {
    if (library) {
      setFactoryIsCorrect(isValidAddress(library, factory))
    }
  }, [library, factory])

  const [admin, setAdmin] = useState('')
  const [feeRecipient, setFeeRecipient] = useState('')
  const [allFeesToAdmin, setAllFeesToAdmin] = useState(false)
  const [liquidityProviderFee, setLiquidityProviderFee] = useState<number | string>('')
  const [adminFee, setAdminFee] = useState<number | string>('')

  const updateFeesToAdmin = (event: any) => setAllFeesToAdmin(event.target.checked)

  const fetchContractOptions = async () => {
    if (!library) return

    setPending(true)

    try {
      const options: any = await getFactoryOptions(library, factory)

      if (options) {
        const { protocolFee, totalFee, feeTo, feeToSetter, allFeeToProtocol } = options

        setAdmin(feeToSetter)
        setFeeRecipient(feeTo === ZERO_ADDRESS ? '' : feeTo)
        setAllFeesToAdmin(allFeeToProtocol)
        setLiquidityProviderFee(totalFee / 10)
        setAdminFee(protocolFee / 100)
      }
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
    }
  }

  const saveOption = async (method: string) => {
    let value

    switch (method) {
      case factoryMethods.setFeeToSetter:
        value = admin
        break
      case factoryMethods.setFeeTo:
        value = feeRecipient
        break
      case factoryMethods.setAllFeeToProtocol:
        value = allFeesToAdmin
        break
      case factoryMethods.setTotalFee:
        // TODO: fix bignum problem. We can't use native operations, there are not integer numbers
        //@ts-ignore
        value = liquidityProviderFee * 10 // BigNumber.from(liquidityProviderFee).mul(10).toNumber()
        break
      case factoryMethods.setProtocolFee:
        //@ts-ignore
        value = adminFee * 100 // BigNumber.from(adminFee).mul(100).toNumber()
        break
      default:
        value = ''
    }

    setPending(true)

    try {
      await setFactoryOption({
        //@ts-ignore
        library,
        from: account ?? '',
        factoryAddress: factory,
        method,
        value,
        onHash: (hash: string) => {
          addTransaction(
            { hash },
            {
              summary: `Chain ${chainId}. Save factory settings`,
            }
          )
        },
      })
    } catch (error) {
      setError(error)
    }

    setPending(false)
  }

  return (
    <section>
      <OptionWrapper>
        <InputWrapper>
          <AddressInputPanel label={`${t('factoryAddress')} *`} value={factory} onChange={setFactory} />
        </InputWrapper>
        <Button
          onClick={fetchContractOptions}
          // pending={pending}
          disabled={!factoryIsCorrect || pending}
        >
          {t('fetchOptions')}
        </Button>
      </OptionWrapper>

      <Info>{t('youCanUseTheSameAddressForBoothInputs')}</Info>

      <div className={`${!factoryIsCorrect || pending ? 'disabled' : ''}`}>
        <OptionWrapper>
          <AddressInputPanel label={`${t('newAdmin')}`} value={admin} onChange={setAdmin} />
          <Button onClick={() => saveOption(factoryMethods.setFeeToSetter)} disabled={!admin}>
            {t('save')}
          </Button>
        </OptionWrapper>
        <OptionWrapper>
          <AddressInputPanel
            label={
              <InputLabel>
                {t('feeRecipient')} <QuestionHelper text={t('feeIsChargedWhen')} />
              </InputLabel>
            }
            value={feeRecipient}
            onChange={setFeeRecipient}
          />
          <Button onClick={() => saveOption(factoryMethods.setFeeTo)} disabled={!feeRecipient}>
            {t('save')}
          </Button>
        </OptionWrapper>
        <OptionWrapper margin={0.8}>
          <Box>
            <LabelExtended>
              <Checkbox id="remember" name="remember" onChange={updateFeesToAdmin} />
              {t('allFeesToAdmin')}
            </LabelExtended>
          </Box>
          <Button onClick={() => saveOption(factoryMethods.setAllFeeToProtocol)} disabled={!factoryIsCorrect}>
            {t('save')}
          </Button>
        </OptionWrapper>
        <OptionWrapper>
          <InputPanel
            label={`${t('liquidityProviderFee')}`}
            value={liquidityProviderFee}
            onChange={setLiquidityProviderFee}
          />
          <Button
            onClick={() => saveOption(factoryMethods.setTotalFee)}
            disabled={!factoryIsCorrect || (!liquidityProviderFee && liquidityProviderFee !== 0)}
          >
            {t('save')}
          </Button>
        </OptionWrapper>

        <OptionWrapper>
          <InputPanel label={`${t('adminFee')}`} value={adminFee} onChange={setAdminFee} />
          <Button
            onClick={() => saveOption(factoryMethods.setProtocolFee)}
            disabled={!factoryIsCorrect || (!adminFee && adminFee !== 0)}
          >
            {t('save')}
          </Button>
        </OptionWrapper>
      </div>
    </section>
  )
}
